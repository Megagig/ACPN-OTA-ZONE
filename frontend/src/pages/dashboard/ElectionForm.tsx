import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import electionService from '../../services/election.service';
import type { Election, Position } from '../../types/election.types';

const ElectionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<Election>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    rules: '',
    status: 'draft',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPositions();

    if (isEditing) {
      fetchElection(id);
    }
  }, [id, isEditing]);

  const fetchPositions = async () => {
    try {
      const positions = await electionService.getPositions();
      setAvailablePositions(positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchElection = async (electionId: string) => {
    setIsLoading(true);
    try {
      const data = await electionService.getElectionById(electionId);
      setFormData({
        title: data.title,
        description: data.description,
        startDate: data.startDate.split('T')[0],
        endDate: data.endDate.split('T')[0],
        rules: data.rules || '',
        status: data.status,
      });

      // Set selected positions
      setSelectedPositions(data.positions.map((pos) => pos._id));
    } catch (error) {
      console.error('Error fetching election:', error);
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

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (checked) {
      setSelectedPositions((prev) => [...prev, value]);
    } else {
      setSelectedPositions((prev) => prev.filter((id) => id !== value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) >= new Date(formData.endDate)
    ) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (selectedPositions.length === 0) {
      newErrors.positions = 'At least one position must be selected';
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
      // Prepare data - for startDate and endDate, append a default time
      const dataToSave = {
        ...formData,
        startDate: `${formData.startDate}T08:00:00`,
        endDate: `${formData.endDate}T17:00:00`,
      };

      let result;

      if (isEditing) {
        result = await electionService.updateElection(id, dataToSave);

        // Update positions separately
        // In a real app, this would be handled by the backend
        const election = await electionService.getElectionById(id);
        const positionsToUse = availablePositions.filter((pos) =>
          selectedPositions.includes(pos._id)
        );
        result = await electionService.updateElection(id, {
          ...result,
          positions: positionsToUse,
        });
      } else {
        result = await electionService.createElection(dataToSave);

        // Update positions separately
        // In a real app, this would be handled by the backend
        const positionsToUse = availablePositions.filter((pos) =>
          selectedPositions.includes(pos._id)
        );
        result = await electionService.updateElection(result._id, {
          ...result,
          positions: positionsToUse,
        });
      }

      // Navigate back to the elections list or detail page
      navigate(isEditing ? `/elections/${id}` : '/elections/list');
    } catch (error) {
      console.error('Error saving election:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? 'Edit Election' : 'Create Election'}
        </h1>
        <button
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-lg shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Title */}
          <div className="col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`border ${
                errors.title ? 'border-red-500' : 'border-input'
              } bg-background text-foreground rounded-md shadow-sm p-2 w-full focus:ring-ring focus:border-ring`}
              placeholder="Enter election title"
              value={formData.title || ''}
              onChange={handleChange}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className={`border ${
                errors.startDate ? 'border-red-500' : 'border-input'
              } bg-background text-foreground rounded-md shadow-sm p-2 w-full focus:ring-ring focus:border-ring`}
              value={formData.startDate || ''}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-foreground mb-1"
            >
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className={`border ${
                errors.endDate ? 'border-red-500' : 'border-input'
              } bg-background text-foreground rounded-md shadow-sm p-2 w-full focus:ring-ring focus:border-ring`}
              value={formData.endDate || ''}
              onChange={handleChange}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={`border ${
                errors.description ? 'border-red-500' : 'border-input'
              } bg-background text-foreground rounded-md shadow-sm p-2 w-full focus:ring-ring focus:border-ring`}
              placeholder="Enter election description"
              value={formData.description || ''}
              onChange={handleChange}
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Rules */}
          <div className="col-span-2">
            <label
              htmlFor="rules"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Rules & Regulations
            </label>
            <textarea
              id="rules"
              name="rules"
              rows={5}
              className="border border-input bg-background text-foreground rounded-md shadow-sm p-2 w-full focus:ring-ring focus:border-ring"
              placeholder="Enter election rules and regulations"
              value={formData.rules || ''}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Positions */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">
              Positions <span className="text-red-500">*</span>
            </label>

            {availablePositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Loading available positions...
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePositions.map((position) => (
                  <div
                    key={position._id}
                    className="flex items-start space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`position-${position._id}`}
                      value={position._id}
                      checked={selectedPositions.includes(position._id)}
                      onChange={handlePositionChange}
                      className="mt-1 h-4 w-4 text-primary border-input rounded focus:ring-ring"
                    />
                    <label
                      htmlFor={`position-${position._id}`}
                      className="text-sm"
                    >
                      <div className="font-medium text-foreground">
                        {position.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {position.description}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
            {errors.positions && (
              <p className="mt-1 text-sm text-red-500">{errors.positions}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                Save Election
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ElectionForm;
