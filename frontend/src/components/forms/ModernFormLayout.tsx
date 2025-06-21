import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Progress,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useColorModeValue,
  Flex,
  Container,
  Badge,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

// Form Container
interface ModernFormContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  bg?: string;
  shadow?: string;
  borderRadius?: string;
  p?: number | string;
}

export const ModernFormContainer: React.FC<ModernFormContainerProps> = ({
  children,
  title,
  subtitle,
  maxWidth = '2xl',
  bg,
  shadow = '2xl',
  borderRadius = '2xl',
  p = 8,
}) => {
  const cardBg = bg || useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Container maxW={maxWidth} py={8}>
      <Card
        bg={cardBg}
        borderColor={borderColor}
        borderWidth={1}
        borderRadius={borderRadius}
        boxShadow={shadow}
        backdropFilter="blur(10px)"
      >
        {(title || subtitle) && (
          <CardHeader textAlign="center" pb={4}>
            {title && (
              <Heading size="lg" fontWeight="bold" mb={2}>
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text color="gray.600" fontSize="md">
                {subtitle}
              </Text>
            )}
          </CardHeader>
        )}
        
        <CardBody p={p}>
          {children}
        </CardBody>
      </Card>
    </Container>
  );
};

// Form Section
interface ModernFormSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  spacing?: number;
  showDivider?: boolean;
}

export const ModernFormSection: React.FC<ModernFormSectionProps> = ({
  children,
  title,
  subtitle,
  spacing = 6,
  showDivider = false,
}) => {
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box>
      {showDivider && <Divider mb={6} />}
      
      {(title || subtitle) && (
        <VStack align="start" spacing={2} mb={spacing}>
          {title && (
            <Heading size="md" color={headingColor}>
              {title}
            </Heading>
          )}
          {subtitle && (
            <Text color={subtitleColor} fontSize="sm">
              {subtitle}
            </Text>
          )}
        </VStack>
      )}
      
      <VStack spacing={spacing} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};

// Form Actions
interface ModernFormActionsProps {
  children: React.ReactNode;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  spacing?: number;
  pt?: number;
}

export const ModernFormActions: React.FC<ModernFormActionsProps> = ({
  children,
  justifyContent = 'flex-end',
  spacing = 4,
  pt = 6,
}) => {
  return (
    <HStack spacing={spacing} justifyContent={justifyContent} pt={pt}>
      {children}
    </HStack>
  );
};

// Form Button
interface ModernFormButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  loadingText?: string;
  colorScheme?: string;
}

export const ModernFormButton: React.FC<ModernFormButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  isDisabled,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  loadingText,
  colorScheme = 'blue',
}) => {
  const getVariantProps = () => {
    switch (variant) {
      case 'primary':
        return {
          colorScheme,
          variant: 'solid',
        };
      case 'secondary':
        return {
          colorScheme: 'gray',
          variant: 'solid',
        };
      case 'outline':
        return {
          colorScheme,
          variant: 'outline',
        };
      case 'ghost':
        return {
          colorScheme,
          variant: 'ghost',
        };
      default:
        return {
          colorScheme,
          variant: 'solid',
        };
    }
  };
  return (
    <Button
      {...getVariantProps()}
      size={size}
      isLoading={isLoading}
      isDisabled={isDisabled}
      leftIcon={leftIcon || undefined}
      rightIcon={rightIcon || undefined}
      onClick={onClick}
      type={type}
      loadingText={loadingText}
      borderRadius="lg"
      _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
      transition="all 0.2s"
    >
      {children}
    </Button>
  );
};

// Multi-Step Form
interface FormStep {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ModernMultiStepFormProps {
  steps: FormStep[];
  currentStep: number;
  children: React.ReactNode;
  onStepChange?: (step: number) => void;
  isStepValid?: (step: number) => boolean;
  showProgress?: boolean;
  allowStepClick?: boolean;
}

export const ModernMultiStepForm: React.FC<ModernMultiStepFormProps> = ({
  steps,
  currentStep,
  children,
  onStepChange,
  isStepValid,
  showProgress = true,
  allowStepClick = false,
}) => {
  const { activeStep, setActiveStep } = useSteps({
    index: currentStep,
    count: steps.length,
  });

  const handleStepClick = (step: number) => {
    if (allowStepClick && onStepChange) {
      // Check if all previous steps are valid
      let canNavigate = true;
      for (let i = 0; i < step; i++) {
        if (isStepValid && !isStepValid(i)) {
          canNavigate = false;
          break;
        }
      }
      
      if (canNavigate) {
        onStepChange(step);
        setActiveStep(step);
      }
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <VStack spacing={8} align="stretch">
      {/* Progress Bar */}
      {showProgress && (
        <Box>
          <Progress
            value={progressPercentage}
            colorScheme="blue"
            size="sm"
            borderRadius="full"
            bg={useColorModeValue('gray.100', 'gray.700')}
          />
          <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
            Step {currentStep + 1} of {steps.length}
          </Text>
        </Box>
      )}

      {/* Stepper */}
      <Stepper index={activeStep} colorScheme="blue">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator
              cursor={allowStepClick ? 'pointer' : 'default'}
              onClick={() => handleStepClick(index)}
            >
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>

            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
              {step.description && (
                <Text fontSize="sm" color="gray.500">
                  {step.description}
                </Text>
              )}
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      {/* Form Content */}
      <Box>{children}</Box>
    </VStack>
  );
};

// Step Navigation
interface ModernStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isSubmitting?: boolean;
  nextText?: string;
  previousText?: string;
  submitText?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
}

export const ModernStepNavigation: React.FC<ModernStepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isNextDisabled,
  isPreviousDisabled,
  isSubmitting,
  nextText = 'Next',
  previousText = 'Previous',
  submitText = 'Submit',
  showPrevious = true,
  showNext = true,
  showSubmit = true,
}) => {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Flex justifyContent="space-between" pt={6}>
      {/* Previous Button */}
      <Box>
        {showPrevious && !isFirstStep && (
          <ModernFormButton
            variant="outline"
            leftIcon={<FaArrowLeft />}
            onClick={onPrevious}
            isDisabled={isPreviousDisabled || isSubmitting}
          >
            {previousText}
          </ModernFormButton>
        )}
      </Box>

      {/* Next/Submit Button */}
      <Box>
        {isLastStep ? (
          showSubmit && (
            <ModernFormButton
              variant="primary"
              onClick={onSubmit}
              isDisabled={isNextDisabled}
              isLoading={isSubmitting}
              loadingText="Submitting..."
            >
              {submitText}
            </ModernFormButton>
          )
        ) : (
          showNext && (
            <ModernFormButton
              variant="primary"
              rightIcon={<FaArrowRight />}
              onClick={onNext}
              isDisabled={isNextDisabled}
            >
              {nextText}
            </ModernFormButton>
          )
        )}
      </Box>
    </Flex>
  );
};

// Form Grid
interface ModernFormGridProps {
  children: React.ReactNode;
  columns?: number | { base?: number; md?: number; lg?: number };
  spacing?: number;
}

export const ModernFormGrid: React.FC<ModernFormGridProps> = ({
  children,
  columns = { base: 1, md: 2 },
  spacing = 6,
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={
        typeof columns === 'number'
          ? `repeat(${columns}, 1fr)`
          : {
              base: `repeat(${columns.base || 1}, 1fr)`,
              md: `repeat(${columns.md || 2}, 1fr)`,
              lg: `repeat(${columns.lg || columns.md || 2}, 1fr)`,
            }
      }
      gap={spacing}
    >
      {children}
    </Box>
  );
};

// Form Status Badge
interface ModernFormStatusProps {
  status: 'draft' | 'pending' | 'completed' | 'error';
  text?: string;
}

export const ModernFormStatus: React.FC<ModernFormStatusProps> = ({
  status,
  text,
}) => {
  const getStatusProps = () => {
    switch (status) {
      case 'draft':
        return {
          colorScheme: 'gray',
          text: text || 'Draft',
        };
      case 'pending':
        return {
          colorScheme: 'yellow',
          text: text || 'Pending',
        };
      case 'completed':
        return {
          colorScheme: 'green',
          text: text || 'Completed',
        };
      case 'error':
        return {
          colorScheme: 'red',
          text: text || 'Error',
        };
      default:
        return {
          colorScheme: 'gray',
          text: text || status,
        };
    }
  };

  const { colorScheme, text: statusText } = getStatusProps();

  return (
    <Badge
      colorScheme={colorScheme}
      variant="subtle"
      borderRadius="full"
      px={3}
      py={1}
      fontSize="xs"
      fontWeight="semibold"
    >
      {statusText}
    </Badge>
  );
};
