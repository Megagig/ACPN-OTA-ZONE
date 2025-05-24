import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Poll, PollQuestion } from '../../types/poll.types';
import pollService from '../../services/poll.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardBody } from '../../components/common/CardComponent';
import { Alert, AlertIcon } from '../../components/common/AlertComponent';
import { useToast } from '../../hooks/useToast';

interface FormValues {
  [key: string]: string | string[] | number | boolean;
}

const PollResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
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
          const hasUserResponded = await pollService.hasUserResponded(id);
          setHasResponded(hasUserResponded);
        }
      } catch (error) {
        toast({
          title: 'Error loading poll',
          description: 'Unable to load poll data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, toast]);

  const handleInputChange = (questionId: string, value: string | string[] | number | boolean) => {
    setFormValues(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error for this field
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    if (!poll) return false;

    const question = poll.questions[stepIndex];
    const value = formValues[question._id];
    const newErrors: { [key: string]: string } = {};

    if (question.isRequired) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        newErrors[question._id] = 'This question is required';
      }
    }

    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!poll || !validateStep(currentStep)) return;

    try {
      setSubmitting(true);
      
      const responses = poll.questions.map(question => ({
        questionId: question._id,
        answer: formValues[question._id]
      }));

      await pollService.submitPollResponse(poll._id, responses);
      
      toast({
        title: 'Response submitted',
        description: 'Your poll response has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/dashboard/polls');
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Unable to submit your response. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: PollQuestion) => {
    const value = formValues[question._id];
    const error = errors[question._id];

    switch (question.questionType) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option._id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question._id}
                  value={option._id}
                  checked={value === option._id}
                  onChange={(e) => handleInputChange(question._id, e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">{option.optionText}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option._id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option._id}
                  checked={Array.isArray(value) && value.includes(option._id)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option._id]
                      : currentValues.filter(v => v !== option._id);
                    handleInputChange(question._id, newValues);
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">{option.optionText}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label key={rating} className="flex flex-col items-center cursor-pointer">
                <input
                  type="radio"
                  name={question._id}
                  value={rating}
                  checked={value === rating}
                  onChange={(e) => handleInputChange(question._id, parseInt(e.target.value))}
                  className="form-radio h-4 w-4 text-blue-600 mb-1"
                />
                <span className="text-sm text-gray-600">{rating}</span>
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
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question._id}
                value="false"
                checked={value === false}
                onChange={() => handleInputChange(question._id, false)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">No</span>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return <div className="text-gray-500">Unsupported question type</div>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
            <div>The requested poll could not be found or you don't have access to it.</div>
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
            <div>You have already responded to this poll. Thank you for your participation!</div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
          <p className="text-gray-600">{poll.description}</p>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {currentStep + 1} of {poll.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentStep + 1}. {currentQuestion.questionText}
                </h2>
                {currentQuestion.isRequired && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                {renderQuestion(currentQuestion)}
              </div>

              {errors[currentQuestion._id] && (
                <div className="text-red-600 text-sm mt-2">
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
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
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
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white transition-colors`}
                >
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Back to Polls
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PollResponse;
