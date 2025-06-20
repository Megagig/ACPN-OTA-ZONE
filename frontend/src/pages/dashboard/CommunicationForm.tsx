import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import communicationService from '../../services/communication.service';
import type { Communication, CommunicationType } from '../../types/communication.types';

const CommunicationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type') as CommunicationType | null;

  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  const [formData, setFormData] = useState<Partial<Communication>>({
    title: '',
    content: '',
    type: typeFromQuery || 'announcement',
    recipientType: 'all_members',
    status: 'draft',
  });

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      fetchCommunication(id);
    }
  }, [id, isEditing]);

  const fetchCommunication = async (commId: string) => {
    setIsLoading(true);
    try {
      const data = await communicationService.getCommunicationById(commId);
      setFormData(data);

      if (data.scheduledFor) {
        const date = new Date(data.scheduledFor);
        setScheduleDate(date.toISOString().split('T')[0]);
        setScheduleTime(date.toTimeString().slice(0, 5));
        setShowScheduleOptions(true);
      }

      if (data.attachments) {
        setAttachments(data.attachments);
      }
    } catch (error) {
      console.error('Error fetching communication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.type) {
      newErrors.type = 'Communication type is required';
    }

    if (!formData.recipientType) {
      newErrors.recipientType = 'Recipient type is required';
    }

    if (showScheduleOptions) {
      if (!scheduleDate) {
        newErrors.scheduleDate = 'Schedule date is required';
      }

      if (!scheduleTime) {
        newErrors.scheduleTime = 'Schedule time is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Prepare data
      const dataToSave = {
        ...formData,
        attachments,
      };

      if (isEditing && id) {
        await communicationService.updateCommunication(id, dataToSave);
      } else {
        await communicationService.createCommunication(dataToSave);
      }

      // Navigate back to the communications list or detail page
      navigate(isEditing && id ? `/communications/${id}` : '/communications/list');
    } catch (error) {
      console.error('Error saving communication:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsScheduling(true);

    try {
      // Create DateTime string for scheduled date
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      // First save the communication
      let commId = id;
      if (!isEditing) {
        const newComm = await communicationService.createCommunication({
          ...formData,
          attachments,
        });
        commId = newComm._id;
      } else if (id) {
        await communicationService.updateCommunication(id, {
          ...formData,
          attachments,
        });
      }

      // Then schedule it
      if (commId) {
        await communicationService.scheduleCommunication(
          commId,
          scheduledDateTime.toISOString()
        );
      }

      // Navigate back to the communications list or detail page
      navigate(isEditing && id ? `/communications/${id}` : '/communications/list');
    } catch (error) {
      console.error('Error scheduling communication:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is just a mock implementation
    // In a real app, you would upload the file to a server and get back a URL

    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Mock attachment URLs
    const newAttachments = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Communication' : 'New Communication'}
        </h1>
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm shadow"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Title */}
          <div className="col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`border ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-2 w-full`}
              placeholder="Enter communication title"
              value={formData.title || ''}
              onChange={handleChange}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              className={`border ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-2 w-full`}
              value={formData.type || ''}
              onChange={handleChange}
            >
              <option value="announcement">Announcement</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="private_message">Private Message</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Recipients */}
          <div>
            <label
              htmlFor="recipientType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Recipients <span className="text-red-500">*</span>
            </label>
            <select
              id="recipientType"
              name="recipientType"
              className={`border ${
                errors.recipientType ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-2 w-full`}
              value={formData.recipientType || ''}
              onChange={handleChange}
            >
              <option value="all_members">All Members</option>
              <option value="executives">Executives Only</option>
              <option value="committee">Committee Members</option>
              <option value="specific_members">Specific Members</option>
            </select>
            {errors.recipientType && (
              <p className="mt-1 text-sm text-red-500">
                {errors.recipientType}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="col-span-2">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              className={`border ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm p-2 w-full`}
              placeholder="Enter communication content"
              value={formData.content || ''}
              onChange={handleChange}
            ></textarea>
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          {/* Attachments */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm">
                <i className="fas fa-paperclip mr-2"></i>
                Add Attachment
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleAttachmentUpload}
                />
              </label>
              <span className="text-sm text-gray-500">
                {attachments.length}{' '}
                {attachments.length === 1 ? 'file' : 'files'} attached
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((_, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Attachment {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Options */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <input
                id="schedule-toggle"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={showScheduleOptions}
                onChange={() => setShowScheduleOptions(!showScheduleOptions)}
              />
              <label
                htmlFor="schedule-toggle"
                className="text-sm font-medium text-gray-700"
              >
                Schedule for later
              </label>
            </div>

            {showScheduleOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label
                    htmlFor="scheduleDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="scheduleDate"
                    type="date"
                    className={`border ${
                      errors.scheduleDate ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm p-2 w-full`}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.scheduleDate && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.scheduleDate}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="scheduleTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="scheduleTime"
                    type="time"
                    className={`border ${
                      errors.scheduleTime ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm p-2 w-full`}
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                  {errors.scheduleTime && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.scheduleTime}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          {showScheduleOptions ? (
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              onClick={handleScheduleSubmit}
              disabled={isScheduling}
            >
              {isScheduling ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Scheduling...
                </>
              ) : (
                <>
                  <i className="fas fa-clock mr-2"></i>
                  Schedule
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save as Draft
                  </>
                )}
              </button>

              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                onClick={async () => {
                  if (validateForm()) {
                    try {
                      setIsSaving(true);
                      // First save/update the communication
                      let commId = id;
                      if (!isEditing) {
                        const newComm =
                          await communicationService.createCommunication({
                            ...formData,
                            attachments,
                          });
                        commId = newComm._id;
                      } else {
                        await communicationService.updateCommunication(id, {
                          ...formData,
                          attachments,
                        });
                      }

                      // Then send it
                      if (commId) {
                        await communicationService.sendCommunication(commId);
                      }

                      // Navigate back
                      navigate('/communications/list');
                    } catch (error) {
                      console.error('Error sending communication:', error);
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Now
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default CommunicationForm;
