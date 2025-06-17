import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../../services/attendanceService';
import type { Event, AttendeeWithUser } from '../../services/attendanceService';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const AttendanceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [attendanceStatus, setAttendanceStatus] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eventType, setEventType] = useState<string>('all');
  const [calculatingPenalties, setCalculatingPenalties] = useState<boolean>(false);
  const [sendingWarnings, setSendingWarnings] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  
  const cancelRef = useRef<HTMLButtonElement>(null);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Fetch events when year changes
  useEffect(() => {
    fetchEvents();
  }, [year]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await attendanceService.getEvents(year);
      setEvents(fetchedEvents);
      if (fetchedEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(fetchedEvents[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelection = async (event: Event) => {
    setSelectedEvent(event);
    setLoading(true);
    
    try {
      const fetchedAttendees = await attendanceService.getEventAttendees(event._id);
      setAttendees(fetchedAttendees);
      
      // Initialize attendance status from fetched attendees, skipping any with null userId
      const initialStatus = fetchedAttendees.reduce((acc, attendee) => {
        if (attendee.userId && attendee.userId._id) {
          return {
            ...acc,
            [attendee.userId._id]: attendee.attended
          };
        }
        return acc;
      }, {});
      setAttendanceStatus(initialStatus);
    } catch (error) {
      toast.error('Failed to fetch attendees');
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (userId: string, attended: boolean) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [userId]: attended,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      const attendanceData = Object.entries(attendanceStatus).map(([userId, present]) => ({
        userId,
        attended: present
      }));
      
      await attendanceService.updateAttendance(selectedEvent._id, attendanceData);
      toast.success('Attendance has been successfully recorded!');
    } catch (error) {
      toast.error('Unable to save attendance. Please try again.');
      console.error('Error saving attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePenalties = async () => {
    try {
      setCalculatingPenalties(true);
      await attendanceService.calculatePenalties(year);
      setIsOpen(false);
      toast.success(`Penalties for ${year} have been calculated successfully.`);
    } catch (error) {
      toast.error('Unable to calculate penalties. Please try again.');
      console.error('Error calculating penalties:', error);
    } finally {
      setCalculatingPenalties(false);
    }
  };

  const handleSendWarnings = async () => {
    try {
      setSendingWarnings(true);
      await attendanceService.sendWarnings(year);
      setIsWarningOpen(false);
      toast.success(`Attendance warnings for ${year} have been sent successfully.`);
    } catch (error) {
      toast.error('Unable to send warnings. Please try again.');
      console.error('Error sending warnings:', error);
    } finally {
      setSendingWarnings(false);
    }
  };

  const filterAttendees = () => {
    if (!searchTerm) return attendees;

    return attendees.filter((attendee) => {
      const user = attendee.userId;
      const name = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return name.includes(searchLower) || email.includes(searchLower);
    });
  };

  const exportAttendanceCSV = async () => {
    if (!selectedEvent || !attendees.length) return;
    
    try {
      const blob = await attendanceService.exportAttendanceCSV(selectedEvent._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEvent.title}-attendance.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to export attendance data');
      console.error('Error exporting attendance:', error);
    }
  };

  const filteredAttendees = filterAttendees();

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meetings': return 'bg-blue-100 text-blue-800';
      case 'conference': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-yellow-100 text-yellow-800';
      case 'training': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
            <p className="text-gray-600 mt-2">Track and manage attendance for events and meetings</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 shadow-md"
              onClick={() => navigate('/admin/events')}
            >
              <span>Event Management</span>
            </button>

            {year === new Date().getFullYear() && (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 shadow-md"
                  onClick={() => setIsWarningOpen(true)}
                >
                  <span>Send Warnings</span>
                </button>

                <button
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 shadow-md"
                  onClick={() => setIsOpen(true)}
                >
                  <span>Calculate Penalties</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Events</option>
                  <option value="meetings">Meetings Only</option>
                  <option value="conference">Conferences</option>
                  <option value="workshop">Workshops</option>
                  <option value="seminar">Seminars</option>
                  <option value="training">Training</option>
                  <option value="social">Social</option>
                </select>
              </div>
            </div>

            {selectedEvent && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Attendees</label>
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-60 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 mt-6 sm:mt-0 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition duration-200"
                  onClick={exportAttendanceCSV}
                  disabled={!selectedEvent || !attendees.length}
                >
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Events Panel */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md p-6 h-full">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Events</h2>

              {loading && !selectedEvent ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No events found for the selected filters
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className={`p-4 border rounded-lg cursor-pointer transition duration-200 hover:shadow-md ${
                        selectedEvent?._id === event._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onClick={() => handleEventSelection(event)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800">{event.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.eventType)}`}>
                          {event.eventType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center mt-3 text-sm text-gray-500">
                        <span className="flex items-center mr-4">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                          {event.attendees?.length || 0} attendees
                        </span>
                        <span className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Panel */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-md p-6 h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">
                  {selectedEvent ? `${selectedEvent.title} Attendance` : 'Select an Event'}
                </h2>

                {selectedEvent && (
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 shadow-md disabled:opacity-50"
                    onClick={handleSaveAttendance}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </span>
                    ) : (
                      'Save Attendance'
                    )}
                  </button>
                )}
              </div>

              {loading && selectedEvent ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !selectedEvent ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <p>Select an event to manage attendance</p>
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                  <p>No attendees found for this event</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAttendees.map((attendee) => {
                        const user = attendee.userId;
                        if (!user) return null; // Skip rendering if user is null
                        return (
                          <tr key={user._id || attendee._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attendee.markedAt || '').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={!!attendanceStatus[user._id]}
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      user._id,
                                      e.target.checked
                                    )
                                  }
                                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Penalties Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Calculate Attendance Penalties</h3>
              <p className="text-gray-600 mb-4">
                This will calculate penalties for members who didn't meet the 50%
                attendance threshold for meetings in {year}.
              </p>
              <p className="text-gray-600 mb-4">
                The penalty will be half of the total annual dues for each member
                below the threshold.
              </p>
              <p className="text-gray-600 mb-6">Are you sure you want to continue?</p>
              <div className="flex justify-end gap-3">
                <button
                  ref={cancelRef}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCalculatePenalties}
                  disabled={calculatingPenalties}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 disabled:opacity-50"
                >
                  {calculatingPenalties ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </span>
                  ) : (
                    'Calculate Penalties'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Warnings Modal */}
      {isWarningOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Send Attendance Warnings</h3>
              <p className="text-gray-600 mb-4">
                This will send warning notifications to members who are currently
                below the 50% attendance threshold for meetings in {year}.
              </p>
              <p className="text-gray-600 mb-4">
                The warnings will help members avoid penalties by encouraging them
                to attend remaining meetings this year.
              </p>
              <p className="text-gray-600 mb-6">Are you sure you want to send these warnings?</p>
              <div className="flex justify-end gap-3">
                <button
                  ref={cancelRef}
                  onClick={() => setIsWarningOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWarnings}
                  disabled={sendingWarnings}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 disabled:opacity-50"
                >
                  {sendingWarnings ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Warnings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;