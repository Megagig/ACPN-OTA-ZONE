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
  Card,
  CardBody,
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import electionService from '../../services/election.service';
import type { Election, Position, Candidate } from '../../types/election.types';
import DashboardLayout from '../../components/layout/DashboardLayout';

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
    candidateId?: string; // Made candidateId optional as it might not be present for new candidates
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [election, setElection] = useState<Election | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [candidate, setCandidate] = useState<CandidateFormFields | null>(null); // For edit mode
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
          toast.error('Election ID or Position ID is missing.', {
            autoClose: 3000,
          });
          navigate('/elections/list'); // Consider a more appropriate redirect
          return;
        }

        const electionData = await electionService.getElectionById(electionId);
        setElection(electionData);

        if (electionData.status !== 'draft') {
          toast.warning(
            'Candidates can only be added or edited when an election is in draft status',
            { autoClose: 3000 }
          );
          navigate(`/elections/${electionId}`);
          return;
        }

        const posData = electionData.positions.find(
          (pos: Position) => pos._id === positionId // Added type for pos
        );

        if (!posData) {
          toast.error(
            'The requested position does not exist in this election',
            { autoClose: 3000 }
          );
          navigate(`/elections/${electionId}`);
          return;
        }
        setPosition(posData);

        if (candidateId) {
          setIsEdit(true);
          // Fetch actual candidate data if in edit mode
          // This is a placeholder, replace with actual API call
          const existingCandidate = posData.candidates?.find(
            (cand: Candidate) => cand._id === candidateId
          );
          if (existingCandidate) {
            setCandidate({
              name: existingCandidate.name || '',
              email: existingCandidate.email || '',
              phoneNumber: existingCandidate.phoneNumber || '',
              bio: existingCandidate.bio || '',
              photoUrl: existingCandidate.photoUrl || '',
              manifesto: existingCandidate.manifesto || '',
            });
          } else {
            toast.error('Candidate not found for editing.', {
              autoClose: 3000,
            });
            // navigate(`/elections/${electionId}`); // Or handle as appropriate
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Unable to load election or candidate data', {
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [electionId, positionId, candidateId, navigate]);

  const handleSubmit = async (
    values: CandidateFormFields,
    { setSubmitting }: FormikHelpers<CandidateFormFields>
  ) => {
    try {
      if (!electionId || !positionId) {
        toast.error('Election ID or Position ID is missing for submission.', {
          autoClose: 3000,
        });
        return;
      }

      if (isEdit && candidateId) {
        await electionService.updateCandidateInPosition(
          electionId,
          positionId,
          candidateId,
          values as Candidate // Cast to Candidate type
        );
        toast.success('Candidate information has been updated successfully', {
          autoClose: 3000,
        });
      } else {
        await electionService.addCandidate(
          electionId,
          positionId,
          values as Candidate
        );
        toast.success('New candidate has been added successfully', {
          autoClose: 3000,
        });
      }

      navigate(`/elections/${electionId}`);
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('There was a problem saving the candidate information', {
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box p={5} className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </Box>
      </DashboardLayout>
    );
  }

  if (!election || !position) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text className="text-destructive mb-4">
            Error: Election or Position data could not be loaded.
          </Text>
          <Button onClick={() => navigate('/elections/list')}>
            Back to Elections List
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  const formInitialValues = isEdit && candidate ? candidate : initialValues;

  return (
    <DashboardLayout>
      <Box p={{ base: 4, md: 6 }} className="max-w-4xl mx-auto">
        <Flex justify="between" align="center" className="mb-6">
          <Heading size={{ base: 'lg', md: 'xl' }} className="text-foreground">
            {isEdit ? 'Edit Candidate' : 'Add New Candidate'}
          </Heading>
          <Button
            variant="outline"
            onClick={() => navigate(`/elections/${electionId}`)}
            size={{ base: 'sm', md: 'md' }}
          >
            Cancel
          </Button>
        </Flex>

        <Card className="mb-8 shadow-lg">
          <CardBody className="p-5">
            <Stack spacing={4}>
              <Heading size="md" className="text-primary">
                {election.title}
              </Heading>
              <Text className="text-muted-foreground">
                {new Date(election.startDate).toLocaleDateString()} -{' '}
                {new Date(election.endDate).toLocaleDateString()}
              </Text>
              <Divider />
              <Text className="font-semibold text-lg text-foreground">
                Position: {position.name}
              </Text>
              {position.description && (
                <Text className="text-muted-foreground">
                  {position.description}
                </Text>
              )}
            </Stack>
          </CardBody>
        </Card>

        <Formik
          initialValues={formInitialValues}
          validationSchema={candidateValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize // Important for edit mode when candidate data loads
        >
          {({ isSubmitting, errors, touched, values, dirty, isValid }) => (
            <Form>
              <VStack
                spacing={6}
                align="stretch"
                className="bg-card p-6 rounded-lg shadow"
              >
                <HStack
                  spacing={{ base: 0, md: 6 }}
                  align="start"
                  direction={{ base: 'column-reverse', md: 'row' }}
                >
                  <VStack spacing={6} className="flex-1">
                    <Field name="name">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={!!(errors.name && touched.name)}
                          isRequired
                        >
                          <FormLabel htmlFor="name" className="text-foreground">
                            Candidate Name
                          </FormLabel>
                          <Input
                            {...field}
                            id="name"
                            placeholder="Enter full name"
                            className="bg-input"
                          />
                          <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    <Field name="email">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={!!(errors.email && touched.email)}
                          isRequired
                        >
                          <FormLabel
                            htmlFor="email"
                            className="text-foreground"
                          >
                            Email
                          </FormLabel>
                          <Input
                            {...field}
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            className="bg-input"
                          />
                          <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                    <Field name="phoneNumber">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={
                            !!(errors.phoneNumber && touched.phoneNumber)
                          }
                          isRequired
                        >
                          <FormLabel
                            htmlFor="phoneNumber"
                            className="text-foreground"
                          >
                            Phone Number
                          </FormLabel>
                          <Input
                            {...field}
                            id="phoneNumber"
                            placeholder="Enter phone number"
                            className="bg-input"
                          />
                          <FormErrorMessage>
                            {errors.phoneNumber}
                          </FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </VStack>

                  <Box className="w-full md:w-[180px] flex flex-col items-center mb-6 md:mb-0">
                    <Avatar
                      size="xl"
                      name={values.name || 'C'} // Provide a fallback for name
                      src={values.photoUrl || undefined}
                      className="mb-3 shadow-md"
                    />
                    <Field name="photoUrl">
                      {({ field }: FieldProps) => (
                        <FormControl
                          isInvalid={!!(errors.photoUrl && touched.photoUrl)}
                        >
                          <FormLabel
                            htmlFor="photoUrl"
                            textAlign="center"
                            fontSize="sm"
                            className="text-muted-foreground"
                          >
                            Photo URL (Optional)
                          </FormLabel>
                          <Input
                            {...field}
                            id="photoUrl"
                            placeholder="https://example.com/photo.jpg"
                            className="text-sm bg-input"
                          />
                          <FormErrorMessage>{errors.photoUrl}</FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                </HStack>

                <Field name="bio">
                  {({ field }: FieldProps) => (
                    <FormControl
                      isInvalid={!!(errors.bio && touched.bio)}
                      isRequired
                    >
                      <FormLabel htmlFor="bio" className="text-foreground">
                        Bio
                      </FormLabel>
                      <Textarea
                        {...field}
                        id="bio"
                        placeholder="Brief biography (max 500 characters)"
                        rows={4}
                        maxLength={500}
                        className="bg-input"
                      />
                      <FormErrorMessage>{errors.bio}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <Field name="manifesto">
                  {({ field }: FieldProps) => (
                    <FormControl
                      isInvalid={!!(errors.manifesto && touched.manifesto)}
                      isRequired
                    >
                      <FormLabel
                        htmlFor="manifesto"
                        className="text-foreground"
                      >
                        Manifesto
                      </FormLabel>
                      <Textarea
                        {...field}
                        id="manifesto"
                        placeholder="Election promises and plans if elected"
                        rows={6}
                        className="bg-input"
                      />
                      <FormErrorMessage>{errors.manifesto}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <HStack spacing={4} className="justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/elections/${electionId}`)}
                    size={{ base: 'sm', md: 'md' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    isLoading={isSubmitting}
                    type="submit"
                    disabled={!dirty || !isValid || isSubmitting}
                    size={{ base: 'sm', md: 'md' }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
