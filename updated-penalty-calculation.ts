import Event, {
  EventType,
  EventStatus,
} from './backend/src/models/event.model';
import User, { UserRole, UserStatus } from './backend/src/models/user.model';
import Due from './backend/src/models/due.model';
import EventAttendance from './backend/src/models/eventAttendance.model';

// Helper function to calculate meeting penalties based on 50% threshold
export async function calculateMeetingPenalties(year: number) {
  try {
    // Get all meeting events for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const meetings = await Event.find({
      eventType: EventType.MEETING,
      startDate: { $gte: startOfYear, $lte: endOfYear },
      status: { $in: [EventStatus.COMPLETED, EventStatus.PUBLISHED] },
    });

    if (meetings.length === 0) {
      console.log(
        `No meetings found for ${year}. Skipping penalty calculation.`
      );
      return;
    }

    const totalMeetings = meetings.length;
    const attendanceThreshold = 0.5; // 50% threshold

    // Get all active members
    const users = await User.find({
      role: { $in: [UserRole.MEMBER] },
      status: UserStatus.ACTIVE,
    });

    console.log(
      `Calculating penalties for ${users.length} users based on ${totalMeetings} meetings in ${year}`
    );

    for (const user of users) {
      // Count user's meeting attendance for the year
      const attendanceRecords = await EventAttendance.find({
        eventId: { $in: meetings.map((m) => m._id) },
        userId: user._id,
      });

      const attendedMeetings = attendanceRecords.filter(
        (record) => record.attended
      ).length;
      const attendancePercentage =
        totalMeetings > 0 ? attendedMeetings / totalMeetings : 0;

      // Only apply penalty if attendance is below 50%
      if (attendancePercentage < attendanceThreshold) {
        // Get user's annual dues
        const userAnnualDues = await Due.find({
          assignedTo: user._id,
          year,
          isPenalty: false, // Exclude existing penalties
        });

        // Calculate total annual dues
        const totalAnnualDues = userAnnualDues.reduce(
          (sum, due) => sum + due.amount,
          0
        );

        // Penalty is half of the annual dues
        const penaltyAmount = totalAnnualDues * 0.5;

        if (penaltyAmount > 0) {
          // Create or update penalty due
          await Due.findOneAndUpdate(
            {
              assignedTo: user._id,
              title: `Meeting Attendance Penalty ${year}`,
              year,
              isPenalty: true,
            },
            {
              assignedTo: user._id,
              title: `Meeting Attendance Penalty ${year}`,
              description: `Penalty for attending only ${attendedMeetings} out of ${totalMeetings} meetings (${Math.round(
                attendancePercentage * 100
              )}%) in ${year}`,
              amount: penaltyAmount,
              dueDate: new Date(year + 1, 2, 31), // March 31st of next year
              status: 'pending',
              year,
              isPenalty: true,
            },
            { upsert: true }
          );

          console.log(
            `Applied penalty of ${penaltyAmount} to user ${
              user.email
            } (${Math.round(attendancePercentage * 100)}% attendance)`
          );
        }
      } else {
        // Remove any existing penalty if the user now meets the threshold
        const existingPenalty = await Due.findOne({
          assignedTo: user._id,
          title: `Meeting Attendance Penalty ${year}`,
          year,
          isPenalty: true,
        });

        if (existingPenalty) {
          await Due.findByIdAndDelete(existingPenalty._id);
          console.log(
            `Removed penalty for user ${user.email} as they now meet the attendance threshold`
          );
        }
      }
    }

    console.log(`Penalty calculation for ${year} completed successfully`);
  } catch (error) {
    console.error('Error calculating meeting penalties:', error);
    throw error;
  }
}
