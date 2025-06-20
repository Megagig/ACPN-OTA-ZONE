import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Poll, PollQuestion } from '../../types/poll.types';
import pollService from '../../services/poll.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardBody, Alert } from '@chakra-ui/react';
import { AlertIcon } from '../../components/ui/chakra-components';
import { toast } from 'react-toastify';

interface FormValues {
  [key: string]: string | string[] | number | boolean;
}

const PollResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasResponded, setHasResponded] = useState<boolean>(false);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await pollService.getPollById(id);
          setPoll(data);

          // Check if user has already responded
          const hasUserResponded = await pollService.checkUserResponded();
          setHasResponded(hasUserResponded);
        }
      } catch {
        toast.error('Unable to load poll data', { autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id]);

  const handleInputChange = (
    questionId: string,
    value: string | string[] | number | boolean
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error for this field
    if (errors[questionId]) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: '',
      }));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    if (!poll) return false;

    const question = poll.questions[stepIndex];
    const value = formValues[question._id];
    const newErrors: { [key: string]: string } = {};

    if (question.required) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        newErrors[question._id] = 'This question is required';
      }
    }

    setErrors((prev) => ({
      ...prev,
      ...newErrors,
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!poll || !validateStep(currentStep)) return;

    try {
      setSubmitting(true);

      const responses = poll.questions.map((question) => ({
        questionId: question._id,
        answer: Array.isArray(formValues[question._id])
          ? (formValues[question._id] as string[])
          : String(formValues[question._id]),
      }));

      await pollService.submitPollResponse({
        pollId: poll._id,
        answers: responses,
      });

      toast.success('Your poll response has been submitted successfully', {
        autoClose: 3000,
      });

      navigate('/dashboard/polls');
    } catch {
      toast.error('Unable to submit your response. Please try again.', {
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: PollQuestion) => {
    const value = formValues[question._id];
    // const error = errors[question._id]; // Currently not used in UI

    switch (question.type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option._id}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question._id}
                  value={option._id}
                  checked={value === option._id}
                  onChange={(e) =>
                    handleInputChange(question._id, e.target.value)
                  }
                  className="form-radio h-4 w-4 text-primary"
                />
                <span className="text-foreground">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option._id}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option._id}
                  checked={Array.isArray(value) && value.includes(option._id)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option._id]
                      : currentValues.filter((v) => v !== option._id);
                    handleInputChange(question._id, newValues);
                  }}
                  className="form-checkbox h-4 w-4 text-primary"
                />
                <span className="text-foreground">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label
                key={rating}
                className="flex flex-col items-center cursor-pointer"
              >
                <input
                  type="radio"
                  name={question._id}
                  value={rating}
                  checked={value === rating}
                  onChange={(e) =>
                    handleInputChange(question._id, parseInt(e.target.value))
                  }
                  className="form-radio h-4 w-4 text-primary mb-1"
                />
                <span className="text-sm text-muted-foreground">{rating}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question._id}
                value="true"
                checked={value === true}
                onChange={() => handleInputChange(question._id, true)}
                className="form-radio h-4 w-4 text-primary"
              />
              <span className="text-foreground">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question._id}
                value="false"
                checked={value === false}
                onChange={() => handleInputChange(question._id, false)}
                className="form-radio h-4 w-4 text-primary"
              />
              <span className="text-foreground">No</span>
            </label>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
            placeholder="Enter your response..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );

      default:
        return (
          <div className="text-muted-foreground">Unsupported question type</div>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!poll) {
    return (
      <DashboardLayout>
        <Alert status="error">
          <AlertIcon status="error" />
          <div>
            <div className="font-bold">Poll not found</div>
            <div>
              The requested poll could not be found or you don't have access to
              it.
            </div>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  if (poll.status !== 'active') {
    return (
      <DashboardLayout>
        <Alert status="warning">
          <AlertIcon status="warning" />
          <div>
            <div className="font-bold">Poll not available</div>
            <div>This poll is not currently available for responses.</div>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  if (hasResponded) {
    return (
      <DashboardLayout>
        <Alert status="info">
          <AlertIcon status="info" />
          <div>
            <div className="font-bold">Already responded</div>
            <div>
              You have already responded to this poll. Thank you for your
              participation!
            </div>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  const currentQuestion = poll.questions[currentStep];
  const isLastStep = currentStep === poll.questions.length - 1;
  const progress = ((currentStep + 1) / poll.questions.length) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {poll.title}
          </h1>
          <p className="text-muted-foreground">{poll.description}</p>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {poll.questions.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </CardBody>
        </Card>

        {/* Question Card */}
        <Card>
          <CardBody>
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {currentStep + 1}. {currentQuestion.text}
                </h2>
                {currentQuestion.required && (
                  <span className="text-xs bg-destructive/15 text-destructive px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>

              <div className="mb-4">{renderQuestion(currentQuestion)}</div>

              {errors[currentQuestion._id] && (
                <div className="text-destructive text-sm mt-2">
                  {errors[currentQuestion._id]}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-md ${
                  currentStep === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                } transition-colors`}
              >
                Previous
              </button>

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`px-6 py-2 rounded-md ${
                    submitting
                      ? 'bg-primary/50 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  } text-primary-foreground transition-colors`}
                >
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Back to Polls */}
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard/polls')}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Back to Polls
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PollResponse;
