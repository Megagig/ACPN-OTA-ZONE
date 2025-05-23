import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/event.service';
import { Event, EventType, EventStatus } from '../../types/event.types';

// Type for form errors
type FormErrors = {
  [key: string]: string;
};

const EventForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    type: 'conference',
    startDate: '',
    endDate: '',
    location: {
      name: '',
      address: '',
      city: '',
      state: '',
      virtual: false,
      meetingLink: '',
    },
    status: 'draft',
    registrationRequired: false,
    registrationDeadline: '',
    registrationFee: 0,
    maxAttendees: 0,
    organizerName: '',
    organizerId: '',
    tags: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch event data if in edit mode
  useEffect(() => {
    const fetchEventData = async () => {
      if (isEditMode && id) {
        setIsLoading(true);
        try {
          const event = await eventService.getEventById(id);

          // Format dates for form inputs
          const formattedEvent = {
            ...event,
            startDate: formatDateForInput(event.startDate),
            endDate: formatDateForInput(event.endDate),
            registrationDeadline: event.registrationDeadline
              ? formatDateForInput(event.registrationDeadline)
              : '',
          };

          setFormData(formattedEvent);
        } catch (error) {
          console.error('Error fetching event:', error);
          setErrors({ form: 'Failed to load event data' });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEventData();
  }, [id, isEditMode]);

  // Format date string for datetime-local input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
  };

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

    // Handle number inputs
    if (type === 'number') {
      setFormData({ ...formData, [name]: value === '' ? 0 : Number(value) });
      return;
    }

    // Handle nested location fields
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location!,
          [locationField]:
            type === 'checkbox'
              ? (e.target as HTMLInputElement).checked
              : value,
        },
      });
      return;
    }

    // Handle all other inputs
    setFormData({ ...formData, [name]: value });
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description)
      newErrors.description = 'Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.location?.name)
      newErrors['location.name'] = 'Venue name is required';

    // If virtual is false, require physical address details
    if (!formData.location?.virtual) {
      if (!formData.location?.address)
        newErrors['location.address'] = 'Address is required';
      if (!formData.location?.city)
        newErrors['location.city'] = 'City is required';
      if (!formData.location?.state)
        newErrors['location.state'] = 'State is required';
    } else {
      // If virtual is true, require meeting link
      if (!formData.location?.meetingLink)
        newErrors['location.meetingLink'] = 'Meeting link is required';
    }

    // If registration is required, validate registration fields
    if (formData.registrationRequired) {
      if (!formData.registrationDeadline) {
        newErrors.registrationDeadline = 'Registration deadline is required';
      }
    }

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (
      formData.registrationRequired &&
      formData.startDate &&
      formData.registrationDeadline
    ) {
      const startDate = new Date(formData.startDate);
      const regDeadline = new Date(formData.registrationDeadline);

      if (regDeadline > startDate) {
        newErrors.registrationDeadline =
          'Registration deadline must be before event start date';
      }
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
      if (isEditMode && id) {
        await eventService.updateEvent(id, formData);
      } else {
        await eventService.createEvent(formData);
      }

      navigate('/events');
    } catch (error) {
      console.error('Error saving event:', error);
      setErrors({ form: 'Failed to save event. Please try again.' });
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
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>

        {errors.form && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Event Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.title ? 'border-red-300' : ''
                }`}
                value={formData.title}
                onChange={handleInputChange}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.description ? 'border-red-300' : ''
                }`}
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Event Type*
              </label>
              <select
                id="type"
                name="type"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="training">Training</option>
                <option value="meeting">Meeting</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status*
              </label>
              <select
                id="status"
                name="status"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="canceled">Canceled</option>
                <option value="completed">Completed</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Draft events are not visible to members until published.
              </p>
            </div>

            {/* Date and Time */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date & Time*
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.startDate ? 'border-red-300' : ''
                }`}
                value={formData.startDate}
                onChange={handleInputChange}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date & Time*
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.endDate ? 'border-red-300' : ''
                }`}
                value={formData.endDate}
                onChange={handleInputChange}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>

            {/* Location */}
            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Event Location
              </h3>

              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="location.virtual"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    checked={formData.location?.virtual}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    This is a virtual event
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="locationName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {formData.location?.virtual
                      ? 'Virtual Venue Name*'
                      : 'Venue Name*'}
                  </label>
                  <input
                    type="text"
                    id="locationName"
                    name="location.name"
                    className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors['location.name'] ? 'border-red-300' : ''
                    }`}
                    value={formData.location?.name}
                    onChange={handleInputChange}
                    placeholder={
                      formData.location?.virtual
                        ? 'e.g., Zoom Meeting'
                        : 'e.g., ACPN Conference Center'
                    }
                  />
                  {errors['location.name'] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors['location.name']}
                    </p>
                  )}
                </div>

                {formData.location?.virtual ? (
                  <div>
                    <label
                      htmlFor="meetingLink"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Meeting Link*
                    </label>
                    <input
                      type="text"
                      id="meetingLink"
                      name="location.meetingLink"
                      className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors['location.meetingLink'] ? 'border-red-300' : ''
                      }`}
                      value={formData.location?.meetingLink}
                      onChange={handleInputChange}
                      placeholder="e.g., https://zoom.us/j/1234567890"
                    />
                    {errors['location.meetingLink'] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors['location.meetingLink']}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address*
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="location.address"
                        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors['location.address'] ? 'border-red-300' : ''
                        }`}
                        value={formData.location?.address}
                        onChange={handleInputChange}
                      />
                      {errors['location.address'] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors['location.address']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        City*
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="location.city"
                        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors['location.city'] ? 'border-red-300' : ''
                        }`}
                        value={formData.location?.city}
                        onChange={handleInputChange}
                      />
                      {errors['location.city'] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors['location.city']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        State*
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="location.state"
                        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors['location.state'] ? 'border-red-300' : ''
                        }`}
                        value={formData.location?.state}
                        onChange={handleInputChange}
                      />
                      {errors['location.state'] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors['location.state']}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Registration Details */}
            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="registrationRequired"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    checked={formData.registrationRequired}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Registration required for this event
                  </span>
                </label>
              </div>

              {formData.registrationRequired && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label
                      htmlFor="registrationDeadline"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Registration Deadline*
                    </label>
                    <input
                      type="datetime-local"
                      id="registrationDeadline"
                      name="registrationDeadline"
                      className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.registrationDeadline ? 'border-red-300' : ''
                      }`}
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                    />
                    {errors.registrationDeadline && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.registrationDeadline}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="registrationFee"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Registration Fee (₦)
                    </label>
                    <input
                      type="number"
                      id="registrationFee"
                      name="registrationFee"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.registrationFee || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave at 0 for free events
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="maxAttendees"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Max Attendees
                    </label>
                    <input
                      type="number"
                      id="maxAttendees"
                      name="maxAttendees"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.maxAttendees || ''}
                      onChange={handleInputChange}
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty for unlimited
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="organizerName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Organizer Name
              </label>
              <input
                type="text"
                id="organizerName"
                name="organizerName"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.organizerName || ''}
                onChange={handleInputChange}
                placeholder="e.g., ACPN Event Committee"
              />
            </div>

            {/* Tags */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags
              </label>
              <div className="flex flex-wrap mb-2">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2"
                  >
                    {tag}
                    <button
                      type="button"
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <span className="sr-only">Remove tag</span>
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  id="tagInput"
                  className="block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleAddTag}
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Press Enter or click Add to add a tag. Tags help with event
                classification and searching.
              </p>
            </div>

            {/* Thumbnail URL */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="thumbnail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Thumbnail URL
              </label>
              <input
                type="text"
                id="thumbnail"
                name="thumbnail"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.thumbnail || ''}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com/images/event.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to an image that represents this event.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate('/events')}
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
                'Update Event'
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
