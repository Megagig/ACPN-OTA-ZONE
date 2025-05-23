import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  FormErrorMessage,
  VStack,
  HStack,
  Avatar,
  Card,
  CardBody,
  Stack,
  Divider,
  Flex,
} from '@chakra-ui/react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { electionService } from '../../services/election.service';
import { Candidate, Election, Position } from '../../types/election.types';

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
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [election, setElection] = useState<Election | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
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
          toast({
            title: 'Cannot modify candidates',
            description:
              'Candidates can only be added or edited when an election is in draft status',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          navigate(`/elections/${electionId}`);
          return;
        }

        // Find the position
        const posData = electionData.positions.find(
          (pos) => pos._id === positionId
        );
        if (!posData) {
          toast({
            title: 'Position not found',
            description:
              'The requested position does not exist in this election',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          navigate(`/elections/${electionId}`);
          return;
        }
        setPosition(posData);

        // If candidateId is provided, fetch the candidate for editing
        if (candidateId) {
          setIsEdit(true);
          const candidateData = posData.candidates?.find(
            (cand) => cand._id === candidateId
          );
          if (!candidateData) {
            toast({
              title: 'Candidate not found',
              description: 'The requested candidate does not exist',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            navigate(`/elections/${electionId}`);
            return;
          }
          setCandidate(candidateData);
        }
      } catch (error) {
        toast({
          title: 'Error loading data',
          description: 'Unable to load election or candidate data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [electionId, positionId, candidateId, navigate, toast]);

  const handleSubmit = async (
    values: CandidateFormFields,
    { setSubmitting }: FormikHelpers<CandidateFormFields>
  ) => {
    try {
      if (!electionId || !positionId) return;

      if (isEdit && candidateId) {
        // Update existing candidate
        await electionService.updateCandidate(
          electionId,
          positionId,
          candidateId,
          values
        );
        toast({
          title: 'Candidate updated',
          description: 'Candidate information has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new candidate
        await electionService.addCandidate(electionId, positionId, values);
        toast({
          title: 'Candidate added',
          description: 'New candidate has been added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      navigate(`/elections/${electionId}`);
    } catch (error) {
      toast({
        title: 'Error saving candidate',
        description: 'There was a problem saving the candidate information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
          <Button mt={4} onClick={() => navigate('/elections/list')}>
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
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
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

        <Card mb={6}>
          <CardBody>
            <Stack spacing={3}>
              <Heading size="md">{election.title}</Heading>
              <Text color="gray.600">
                {new Date(election.startDate).toLocaleDateString()} -{' '}
                {new Date(election.endDate).toLocaleDateString()}
              </Text>
              <Divider />
              <Text fontWeight="bold">Position: {position.title}</Text>
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
                  <Box flex="1">
                    <Field name="name">
                      {({ field }: any) => (
                        <FormControl isInvalid={errors.name && touched.name}>
                          <FormLabel>Candidate Name</FormLabel>
                          <Input {...field} placeholder="Enter full name" />
                          <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                  <Box
                    width="150px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <Avatar
                      size="xl"
                      name={values.name || 'Candidate'}
                      src={values.photoUrl || undefined}
                      mb={3}
                    />
                    <Field name="photoUrl">
                      {({ field }: any) => (
                        <FormControl
                          isInvalid={errors.photoUrl && touched.photoUrl}
                        >
                          <FormLabel textAlign="center" fontSize="sm">
                            Photo URL
                          </FormLabel>
                          <Input
                            {...field}
                            placeholder="URL to photo"
                            size="sm"
                          />
                          <FormErrorMessage>{errors.photoUrl}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                </HStack>

                <HStack spacing={6}>
                  <Box flex="1">
                    <Field name="email">
                      {({ field }: any) => (
                        <FormControl isInvalid={errors.email && touched.email}>
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
                  <Box flex="1">
                    <Field name="phoneNumber">
                      {({ field }: any) => (
                        <FormControl
                          isInvalid={errors.phoneNumber && touched.phoneNumber}
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
                  {({ field }: any) => (
                    <FormControl isInvalid={errors.bio && touched.bio}>
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
                  {({ field }: any) => (
                    <FormControl
                      isInvalid={errors.manifesto && touched.manifesto}
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

                <HStack spacing={4} justify="flex-end" pt={4}>
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
