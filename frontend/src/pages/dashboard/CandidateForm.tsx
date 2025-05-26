import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, type FieldProps } from 'formik';
import type { FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  FormErrorMessage,
  VStack,
  HStack,
  Divider,
  Flex,
  Avatar,
  Stack,
} from '../../components/ui/TailwindComponentsFixed';
import DashboardLayout from '../../components/layout/DashboardLayout';
import electionService from '../../services/election.service';
import type { Election, Position } from '../../types/election.types';
import { Card, CardBody } from '../../components/common/CardComponent';
import { useToast } from '../../hooks/useToast';

interface CandidateFormFields {
  name: string;
  email: string;
  phoneNumber: string;
  bio: string;
  photoUrl: string;
  manifesto: string;
}

const candidateValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phoneNumber: Yup.string().required('Phone number is required'),
  bio: Yup.string()
    .required('Bio is required')
    .max(500, 'Bio cannot exceed 500 characters'),
  photoUrl: Yup.string().url('Must be a valid URL').nullable(),
  manifesto: Yup.string().required('Manifesto is required'),
});

const CandidateForm: React.FC = () => {
  const { electionId, positionId, candidateId } = useParams<{
    electionId: string;
    positionId: string;
    candidateId: string;
  }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [election, setElection] = useState<Election | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [candidate, setCandidate] = useState<CandidateFormFields | null>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const initialValues: CandidateFormFields = {
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    photoUrl: '',
    manifesto: '',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (!electionId || !positionId) {
          navigate('/elections/list');
          return;
        }

        // Fetch election data
        const electionData = await electionService.getElectionById(electionId);
        setElection(electionData);

        // Check if election is in draft status
        if (electionData.status !== 'draft') {
          showToast(
            'Cannot modify candidates',
            'Candidates can only be added or edited when an election is in draft status',
            'warning'
          );
          navigate(`/elections/${electionId}`);
          return;
        }

        // Find the position
        const posData = electionData.positions.find(
          (pos) => pos._id === positionId
        );
        if (!posData) {
          showToast(
            'Position not found',
            'The requested position does not exist in this election',
            'error'
          );
          navigate(`/elections/${electionId}`);
          return;
        }
        setPosition(posData);

        // If candidateId is provided, fetch the candidate for editing
        if (candidateId) {
          setIsEdit(true);
          // In a real app, you would fetch from API
          // For this example, we'll construct a demo candidate based on the ID
          // In your real implementation, this would be replaced with real API data
          const demoCandidate: CandidateFormFields = {
            name: `Candidate ${candidateId.substring(0, 4)}`,
            email: `candidate${candidateId.substring(0, 4)}@example.com`,
            phoneNumber: '08012345678',
            bio: 'A professional pharmacist with years of experience',
            photoUrl: '',
            manifesto: 'Working to improve healthcare access for all members',
          };

          setCandidate(demoCandidate);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast(
          'Error loading data',
          'Unable to load election or candidate data',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [electionId, positionId, candidateId, navigate, showToast]);

  const handleSubmit = async (
    values: CandidateFormFields,
    { setSubmitting }: FormikHelpers<CandidateFormFields>
  ) => {
    try {
      if (!electionId || !positionId) return;

      if (isEdit && candidateId) {
        // Update existing candidate
        await electionService.updateCandidateInPosition(
          electionId,
          positionId,
          candidateId,
          values
        );
        showToast(
          'Candidate updated',
          'Candidate information has been updated successfully',
          'success'
        );
      } else {
        // Create new candidate
        await electionService.addCandidate(electionId, positionId, values);
        showToast(
          'Candidate added',
          'New candidate has been added successfully',
          'success'
        );
      }

      navigate(`/elections/${electionId}`);
    } catch (error) {
      console.error('Error saving candidate:', error);
      showToast(
        'Error saving candidate',
        'There was a problem saving the candidate information',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Loading...</Text>
        </Box>
      </DashboardLayout>
    );
  }

  if (!election || !position) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Election or position not found</Text>
          <Button className="mt-4" onClick={() => navigate('/elections/list')}>
            Back to Elections
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  // Prepare form initial values if editing
  const formInitialValues =
    isEdit && candidate
      ? {
          name: candidate.name || '',
          email: candidate.email || '',
          phoneNumber: candidate.phoneNumber || '',
          bio: candidate.bio || '',
          photoUrl: candidate.photoUrl || '',
          manifesto: candidate.manifesto || '',
        }
      : initialValues;

  return (
    <DashboardLayout>
      <Box p={5}>
        <Flex justify="between" align="center" className="mb-4">
          <Heading size="lg">
            {isEdit ? 'Edit Candidate' : 'Add New Candidate'}
          </Heading>
          <Button
            variant="outline"
            onClick={() => navigate(`/elections/${electionId}`)}
          >
            Cancel
          </Button>
        </Flex>

        <Card className="mb-6">
          <CardBody>
            <Stack spacing={3}>
              <Heading size="md">{election.title}</Heading>
              <Text className="text-gray-600">
                {new Date(election.startDate).toLocaleDateString()} -{' '}
                {new Date(election.endDate).toLocaleDateString()}
              </Text>
              <Divider />
              <Text className="font-bold">Position: {position.name}</Text>
              <Text>{position.description}</Text>
            </Stack>
          </CardBody>
        </Card>

        <Formik
          initialValues={formInitialValues}
          validationSchema={candidateValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, values }) => (
            <Form>
              <VStack spacing={6} align="stretch">
                <HStack spacing={6} align="start">
                  <Box className="flex-1">
                    <Field name="name">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={!!(errors.name && touched.name)}
                        >
                          <FormLabel>Candidate Name</FormLabel>
                          <Input {...field} placeholder="Enter full name" />
                          <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                  <Box className="w-[150px] flex flex-col items-center">
                    <Avatar
                      size="xl"
                      name={values.name || 'Candidate'}
                      src={values.photoUrl || undefined}
                      className="mb-3"
                    />
                    <Field name="photoUrl">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={!!(errors.photoUrl && touched.photoUrl)}
                        >
                          <FormLabel textAlign="center" fontSize="sm">
                            Photo URL
                          </FormLabel>
                          <Input
                            {...field}
                            placeholder="URL to photo"
                            className="text-sm"
                          />
                          <FormErrorMessage>{errors.photoUrl}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                </HStack>

                <HStack spacing={6}>
                  <Box className="flex-1">
                    <Field name="email">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={!!(errors.email && touched.email)}
                        >
                          <FormLabel>Email</FormLabel>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter email address"
                          />
                          <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                  <Box className="flex-1">
                    <Field name="phoneNumber">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={
                            !!(errors.phoneNumber && touched.phoneNumber)
                          }
                        >
                          <FormLabel>Phone Number</FormLabel>
                          <Input {...field} placeholder="Enter phone number" />
                          <FormErrorMessage>
                            {errors.phoneNumber}
                          </FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                </HStack>

                <Field name="bio">
                  {({ field }: FieldProps) => (
                    <FormControl isInvalid={!!(errors.bio && touched.bio)}>
                      <FormLabel>Bio</FormLabel>
                      <Textarea
                        {...field}
                        placeholder="Brief biography (max 500 characters)"
                        rows={3}
                        maxLength={500}
                      />
                      <FormErrorMessage>{errors.bio}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <Field name="manifesto">
                  {({ field }: FieldProps) => (
                    <FormControl
                      isInvalid={!!(errors.manifesto && touched.manifesto)}
                    >
                      <FormLabel>Manifesto</FormLabel>
                      <Textarea
                        {...field}
                        placeholder="Election promises and plans if elected"
                        rows={6}
                      />
                      <FormErrorMessage>{errors.manifesto}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <HStack spacing={4} className="justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/elections/${electionId}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    isLoading={isSubmitting}
                    type="submit"
                  >
                    {isEdit ? 'Update Candidate' : 'Add Candidate'}
                  </Button>
                </HStack>
              </VStack>
            </Form>
          )}
        </Formik>
      </Box>
    </DashboardLayout>
  );
};

export default CandidateForm;
