import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarIcon, CameraIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { Button } from '../../components/shadcn/button';
import { Input } from '../../components/shadcn/input';
import { Textarea } from '../../components/shadcn/textarea';
import { Label } from '../../components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/shadcn/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/shadcn/card';
import { Checkbox } from '../../components/shadcn/checkbox';
import { useToast } from '../../hooks/useToast';
import { EventService } from '../../services/event.service';
import type { EventType } from '../../types/event.types';

interface EventFormData {
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    virtual?: boolean;
    meetingLink?: string;
  };
  requiresRegistration: boolean;
  registrationDeadline: string;
  registrationFee: string;
  capacity: string;
  isAttendanceRequired: boolean;
  organizer: string;
  imageUrl: string;
  tags: string;
}

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'training', label: 'Training' },
  { value: 'meetings', label: 'Meeting' },
  { value: 'state_events', label: 'State Event' },
  { value: 'social', label: 'Social Event' },
  { value: 'other', label: 'Other' },
];

const AdminEventForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventType: 'other' as EventType,
    startDate: '',
    endDate: '',
    location: {
      name: '',
      address: '',
      city: 'Ota',
      state: 'Ogun',
      virtual: false,
      meetingLink: '',
    },
    requiresRegistration: false,
    registrationDeadline: '',
    registrationFee: '',
    capacity: '',
    isAttendanceRequired: false,
    organizer: '',
    imageUrl: '',
    tags: '',
  });

  const loadEvent = useCallback(
    async (eventId: string) => {
      try {
        setLoading(true);
        const event = await EventService.getEventById(eventId);

        setFormData({
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startDate: event.startDate.slice(0, 16), // Format for datetime-local input
          endDate: event.endDate.slice(0, 16),
          location: {
            ...event.location,
            virtual: event.location.virtual || false,
            meetingLink: event.location.meetingLink || '',
          },
          requiresRegistration: event.requiresRegistration,
          registrationDeadline: event.registrationDeadline
            ? event.registrationDeadline.slice(0, 16)
            : '',
          registrationFee: event.registrationFee?.toString() || '',
          capacity: event.capacity?.toString() || '',
          isAttendanceRequired: event.isAttendanceRequired,
          organizer: event.organizer,
          imageUrl: event.imageUrl || '',
          tags: event.tags?.join(', ') || '',
        });
      } catch (error) {
        console.error('Failed to load event:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (isEditing && id) {
      loadEvent(id);
    }
  }, [isEditing, id, loadEvent]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      // Here you would typically upload to your backend/Cloudinary
      // For now, we'll create a mock URL
      const mockUrl = URL.createObjectURL(file);
      handleInputChange('imageUrl', mockUrl);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const eventData = {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        requiresRegistration: formData.requiresRegistration,
        registrationDeadline: formData.registrationDeadline || undefined,
        registrationFee: formData.registrationFee
          ? Number(formData.registrationFee)
          : undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        isAttendanceRequired: formData.isAttendanceRequired,
        organizer: formData.organizer,
        imageUrl: formData.imageUrl || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((tag) => tag.trim())
          : undefined,
      };

      if (isEditing && id) {
        await EventService.updateEvent(id, eventData);
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        await EventService.createEvent(eventData);
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }

      navigate('/admin/events');
    } catch (error) {
      console.error('Failed to save event:', error);
      toast({
        title: 'Error',
        description: isEditing
          ? 'Failed to update event'
          : 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/admin/events')}>
          Back to Events
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Enter event description"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) =>
                    handleInputChange('eventType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) =>
                    handleInputChange('organizer', e.target.value)
                  }
                  placeholder="Enter organizer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="pharmacy, conference, training"
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange('startDate', e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAttendanceRequired"
                  checked={formData.isAttendanceRequired}
                  onCheckedChange={(checked) =>
                    handleInputChange('isAttendanceRequired', checked)
                  }
                />
                <Label htmlFor="isAttendanceRequired">
                  Attendance Required (penalties apply for meetings)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="virtual"
                  checked={formData.location.virtual}
                  onCheckedChange={(checked) =>
                    handleInputChange('location.virtual', checked)
                  }
                />
                <Label htmlFor="virtual">Virtual Event</Label>
              </div>

              {formData.location.virtual && (
                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    value={formData.location.meetingLink}
                    onChange={(e) =>
                      handleInputChange('location.meetingLink', e.target.value)
                    }
                    placeholder="https://zoom.us/j/..."
                    type="url"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="locationName">Venue Name</Label>
                <Input
                  id="locationName"
                  value={formData.location.name}
                  onChange={(e) =>
                    handleInputChange('location.name', e.target.value)
                  }
                  placeholder="Enter venue name"
                  required={!formData.location.virtual}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.location.address}
                  onChange={(e) =>
                    handleInputChange('location.address', e.target.value)
                  }
                  placeholder="Enter venue address"
                  required={!formData.location.virtual}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.location.city}
                    onChange={(e) =>
                      handleInputChange('location.city', e.target.value)
                    }
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.location.state}
                    onChange={(e) =>
                      handleInputChange('location.state', e.target.value)
                    }
                    placeholder="State"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                Registration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresRegistration"
                  checked={formData.requiresRegistration}
                  onCheckedChange={(checked) =>
                    handleInputChange('requiresRegistration', checked)
                  }
                />
                <Label htmlFor="requiresRegistration">
                  Requires Registration
                </Label>
              </div>

              {formData.requiresRegistration && (
                <>
                  <div>
                    <Label htmlFor="registrationDeadline">
                      Registration Deadline
                    </Label>
                    <Input
                      id="registrationDeadline"
                      type="datetime-local"
                      value={formData.registrationDeadline}
                      onChange={(e) =>
                        handleInputChange(
                          'registrationDeadline',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationFee">
                      Registration Fee (₦)
                    </Label>
                    <Input
                      id="registrationFee"
                      type="number"
                      min="0"
                      value={formData.registrationFee}
                      onChange={(e) =>
                        handleInputChange('registrationFee', e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity">Capacity (max attendees)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        handleInputChange('capacity', e.target.value)
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CameraIcon className="w-5 h-5" />
              Event Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image">Upload Event Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>

              {formData.imageUrl && (
                <div className="mt-4">
                  <img
                    src={formData.imageUrl}
                    alt="Event preview"
                    className="max-w-xs h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/events')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading
              ? 'Saving...'
              : isEditing
              ? 'Update Event'
              : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminEventForm;
