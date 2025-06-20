import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Button,
  Text,
  useColorModeValue,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiSave, FiX } from 'react-icons/fi';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
}

interface ModernFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  values: any;
  errors: any;
  touched: any;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
}

const ModernForm: React.FC<ModernFormProps> = ({
  title,
  description,
  fields,
  values,
  errors,
  touched,
  isSubmitting,
  onSubmit,
  onChange,
  onBlur,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');

  const renderField = (field: FormField) => {
    const hasError = errors[field.name] && touched[field.name];

    return (
      <FormControl key={field.name} isInvalid={hasError} isRequired={field.required}>
        <FormLabel fontSize="sm" fontWeight="600">
          {field.label}
        </FormLabel>
        
        {field.type === 'select' ? (
          <Select
            placeholder={field.placeholder}
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            onBlur={() => onBlur(field.name)}
            size="lg"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : field.type === 'textarea' ? (
          <Textarea
            placeholder={field.placeholder}
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            onBlur={() => onBlur(field.name)}
            rows={4}
            resize="vertical"
          />
        ) : (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            onBlur={() => onBlur(field.name)}
            size="lg"
          />
        )}
        
        <FormErrorMessage fontSize="sm">
          {errors[field.name]}
        </FormErrorMessage>
      </FormControl>
    );
  };

  return (
    <Card bg={cardBg} shadow="sm" borderRadius="xl" maxW="2xl" mx="auto">
      <CardHeader>
        <VStack align="start" spacing={2}>
          <Text fontSize="2xl" fontWeight="bold">
            {title}
          </Text>
          {description && (
            <Text color="gray.500" fontSize="md">
              {description}
            </Text>
          )}
        </VStack>
      </CardHeader>
      
      <Divider />
      
      <CardBody>
        <form onSubmit={onSubmit}>
          <VStack spacing={6} align="stretch">
            {fields.map(renderField)}
            
            <HStack spacing={4} justify="flex-end" pt={4}>
              {onCancel && (
                <Button
                  variant="outline"
                  leftIcon={<Icon as={FiX} />}
                  onClick={onCancel}
                  isDisabled={isSubmitting}
                  size="lg"
                >
                  {cancelText}
                </Button>
              )}
              <Button
                type="submit"
                colorScheme="brand"
                leftIcon={<Icon as={FiSave} />}
                isLoading={isSubmitting}
                loadingText="Saving..."
                size="lg"
                minW="120px"
              >
                {submitText}
              </Button>
            </HStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
};

export default ModernForm;
