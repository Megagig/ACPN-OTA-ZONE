import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/event.service';
import type {
  Event,
  EventAttendee,
  AttendeeStatus,
} from '../../types/event.types';

// Type for form errors
type FormErrors = {
  [key: string]: string;
};

const AttendeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id: eventId, attendeeId } = useParams<{
    id: string;
    attendeeId?: string;
  }>();

  // States
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Partial<EventAttendee>>({
    userName: '',
    pharmacyName: '',
    status: 'registered',
    paid: false,
    paymentMethod: '',
    paymentReference: '',
    checkedIn: false,
    comments: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditMode = !!attendeeId;

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch event details
        const eventData = await eventService.getEventById(eventId);
        setEvent(eventData);

        // If editing an existing attendee, fetch their details
        if (isEditMode && attendeeId) {
          const attendees = await eventService.getEventAttendees(eventId);
          const attendee = attendees.find((a) => a._id === attendeeId);

          if (attendee) {
            setFormData({
              userName: attendee.userName,
              pharmacyName: attendee.pharmacyName || '',
              status: attendee.status,
              paid: attendee.paid,
              paymentMethod: attendee.paymentMethod || '',
              paymentReference: attendee.paymentReference || '',
              checkedIn: attendee.checkedIn,
              comments: attendee.comments || '',
            });
          } else {
            setErrors({ form: 'Attendee not found' });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ form: 'Failed to load data' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, attendeeId, isEditMode]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
      return;
    }

    // Handle all other inputs
    setFormData({ ...formData, [name]: value });
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.userName) newErrors.userName = 'Name is required';

    // If paid is true, payment method is required
    if (formData.paid && !formData.paymentMethod) {
      newErrors.paymentMethod =
        'Payment method is required when marked as paid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo(0, 0); // Scroll to top to see errors
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode && attendeeId) {
        // In a real app, you would update the attendee here
        // For our mock service, we're using updateAttendeeStatus which only updates the status
        await eventService.updateAttendeeStatus(
          eventId!,
          attendeeId,
          formData.status as AttendeeStatus
        );

        // If the user is checked in, call the check-in function
        if (formData.checkedIn) {
          await eventService.checkInAttendee(eventId!, attendeeId);
        }
      } else {
        // Register a new attendee
        await eventService.registerForEvent(eventId!, {
          user: 'user-' + Date.now(), // This would normally come from a user selection
          userName: formData.userName,
          pharmacy: formData.pharmacyName
            ? 'pharmacy-' + Date.now()
            : undefined, // This would normally come from a pharmacy selection
          pharmacyName: formData.pharmacyName || undefined,
          status: formData.status as AttendeeStatus,
          paid: formData.paid,
          paymentMethod: formData.paymentMethod || undefined,
          paymentReference: formData.paymentReference || undefined,
          checkedIn: formData.checkedIn,
          comments: formData.comments || undefined,
        });
      }

      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error('Error saving attendee:', error);
      setErrors({ form: 'Failed to save attendee. Please try again.' });
      window.scrollTo(0, 0);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse bg-white rounded-lg shadow-md p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The event you are trying to register for does not exist or has been
            removed.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isEditMode ? 'Edit Attendee' : 'Register Attendee'}
        </h1>
        <h2 className="text-lg text-gray-600 mb-6">Event: {event.title}</h2>

        {errors.form && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendee Name */}
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Attendee Name*
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.userName ? 'border-red-300' : ''
                }`}
                value={formData.userName}
                onChange={handleInputChange}
              />
              {errors.userName && (
                <p className="mt-1 text-sm text-red-600">{errors.userName}</p>
              )}
            </div>

            {/* Pharmacy Name */}
            <div>
              <label
                htmlFor="pharmacyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pharmacy Name (Optional)
              </label>
              <input
                type="text"
                id="pharmacyName"
                name="pharmacyName"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.pharmacyName}
                onChange={handleInputChange}
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Registration Status
              </label>
              <select
                id="status"
                name="status"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="registered">Registered</option>
                <option value="confirmed">Confirmed</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="canceled">Canceled</option>
                <option value="attended">Attended</option>
                <option value="no-show">No-Show</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="paid"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    checked={formData.paid}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Mark as Paid
                  </span>
                </label>
              </div>
            </div>

            {/* Payment Method - Only shown if paid is checked */}
            {formData.paid && (
              <>
                <div>
                  <label
                    htmlFor="paymentMethod"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Payment Method*
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.paymentMethod ? 'border-red-300' : ''
                    }`}
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card Payment</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.paymentMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="paymentReference"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Payment Reference (Optional)
                  </label>
                  <input
                    type="text"
                    id="paymentReference"
                    name="paymentReference"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.paymentReference}
                    onChange={handleInputChange}
                    placeholder="e.g., Receipt number, transaction ID"
                  />
                </div>
              </>
            )}

            {/* Check-in Status */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Status
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="checkedIn"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    checked={formData.checkedIn}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {formData.checkedIn ? 'Checked In' : 'Not Checked In'}
                  </span>
                </label>
                {formData.checkedIn && (
                  <p className="mt-1 text-xs text-gray-500">
                    The attendee will be marked as present at the event.
                  </p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="comments"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Comments (Optional)
              </label>
              <textarea
                id="comments"
                name="comments"
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder="Additional notes about this attendee"
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate(`/events/${eventId}`)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : isEditMode ? (
                'Update Attendee'
              ) : (
                'Register Attendee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendeeManagement;
