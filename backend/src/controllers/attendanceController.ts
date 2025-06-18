import { Request, Response } from 'express';
import Event from '../models/Event';
import Attendee from '../models/Attendee';
import { IUser } from '../models/user.model';
import { startOfYear, endOfYear } from 'date-fns';
import mongoose from 'mongoose';

interface IAttendee extends mongoose.Document {
  userId: IUser;
  eventId: mongoose.Types.ObjectId;
  status: string;
  registeredAt: Date;
}

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const startDate = startOfYear(new Date(Number(year), 0));
    const endDate = endOfYear(new Date(Number(year), 0));

    const events = await Event.find({
      startDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ startDate: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

export const getEventAttendees = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const attendees = await Attendee.find({ eventId })
      .populate('userId', 'firstName lastName email')
      .sort({ registeredAt: 1 });

    res.json(attendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ message: 'Error fetching attendees' });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { attendanceData } = req.body;

    const updatePromises = attendanceData.map(({ userId, present }: { userId: string; present: boolean }) =>
      Attendee.findOneAndUpdate(
        { eventId, userId },
        { status: present ? 'present' : 'absent' },
        { new: true }
      )
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance' });
  }
};

export const calculatePenalties = async (req: Request, res: Response) => {
  try {
    const { year } = req.body;
    const startDate = startOfYear(new Date(Number(year), 0));
    const endDate = endOfYear(new Date(Number(year), 0));

    // Get all meetings for the year
    const meetings = await Event.find({
      startDate: { $gte: startDate, $lte: endDate },
      eventType: 'meetings'
    });

    // Get all users
    const users = await mongoose.model<IUser>('User').find({ role: 'member' });

    // Calculate attendance for each user
    const penalties = await Promise.all(
      users.map(async (user: IUser) => {
        const attendances = await Attendee.find({
          userId: user._id,
          eventId: { $in: meetings.map(m => m._id) },
          status: 'present'
        });

        const attendanceRate = attendances.length / meetings.length;
        // Default to 0 if annualDues is not set
        const penalty = attendanceRate < 0.5 ? ((user as any).annualDues || 0) / 2 : 0;

        if (penalty > 0) {
          await mongoose.model<IUser>('User').findByIdAndUpdate(user._id, {
            $inc: { pendingDues: penalty }
          });
        }

        return {
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`,
          attendanceRate,
          penalty
        };
      })
    );

    res.json({ penalties });
  } catch (error) {
    console.error('Error calculating penalties:', error);
    res.status(500).json({ message: 'Error calculating penalties' });
  }
};

export const sendWarnings = async (req: Request, res: Response) => {
  try {
    const { year } = req.body;
    const startDate = startOfYear(new Date(Number(year), 0));
    const endDate = endOfYear(new Date(Number(year), 0));

    // Get all meetings for the year
    const meetings = await Event.find({
      startDate: { $gte: startDate, $lte: endDate },
      eventType: 'meetings'
    });

    // Get all users
    const users = await mongoose.model<IUser>('User').find({ role: 'member' });

    // Calculate attendance and send warnings
    const warnings = await Promise.all(
      users.map(async (user: IUser) => {
        const attendances = await Attendee.find({
          userId: user._id,
          eventId: { $in: meetings.map(m => m._id) },
          status: 'present'
        });

        const attendanceRate = attendances.length / meetings.length;
        
        if (attendanceRate < 0.5) {
          // TODO: Implement actual email sending
          console.log(`Warning sent to ${user.email} - Attendance rate: ${attendanceRate * 100}%`);
        }

        return {
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`,
          attendanceRate,
          warningSent: attendanceRate < 0.5
        };
      })
    );

    res.json({ warnings });
  } catch (error) {
    console.error('Error sending warnings:', error);
    res.status(500).json({ message: 'Error sending warnings' });
  }
};

export const exportAttendanceCSV = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    const attendees = await Attendee.find({ eventId })
      .populate<{ userId: IUser }>('userId', 'firstName lastName email');

    // Create CSV content
    const headers = ['Name', 'Email', 'Status', 'Registration Date'];
    const rows = attendees.map(attendee => [
      `${attendee.userId.firstName} ${attendee.userId.lastName}`,
      attendee.userId.email,
      attendee.status,
      new Date(attendee.registeredAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${event?.title}-attendance.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ message: 'Error exporting attendance' });
  }
}; 