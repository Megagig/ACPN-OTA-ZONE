import React from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Box,
  Text,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { useState } from 'react';

// Base Field Props
interface BaseFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  tooltip?: string;
  containerProps?: any;
}

// Text Input Field
interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
}

export const ModernTextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helperText,
  isRequired,
  isDisabled,
  tooltip,
  type = 'text',
  placeholder,
  value,
  onChange,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'outline',
  containerProps,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const labelColor = useColorModeValue('gray.700', 'gray.200');

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled} {...containerProps}>
      {label && (
        <FormLabel 
          color={labelColor} 
          fontWeight="semibold" 
          fontSize="sm"
          display="flex"
          alignItems="center"
          gap={2}
        >
          {label}
          {tooltip && (
            <Tooltip label={tooltip} placement="top" hasArrow>
              <Box as="span" cursor="help">
                <FaInfoCircle size={12} opacity={0.7} />
              </Box>
            </Tooltip>
          )}
        </FormLabel>
      )}
      
      <InputGroup size={size}>
        {leftIcon && <InputLeftElement>{leftIcon}</InputLeftElement>}
        
        <Input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          variant={variant}
          borderColor={borderColor}
          _hover={{ borderColor: focusBorderColor }}
          _focus={{ 
            borderColor: focusBorderColor,
            boxShadow: `0 0 0 1px ${focusBorderColor}`,
          }}
          borderRadius="lg"
          transition="all 0.2s"
        />
        
        {isPassword && (
          <InputRightElement>
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              icon={showPassword ? <FaEyeSlash /> : <FaEye />}
              onClick={() => setShowPassword(!showPassword)}
              variant="ghost"
              size="sm"
            />
          </InputRightElement>
        )}
        
        {!isPassword && rightIcon && <InputRightElement>{rightIcon}</InputRightElement>}
      </InputGroup>
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Textarea Field
interface TextAreaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export const ModernTextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  error,
  helperText,
  isRequired,
  isDisabled,
  tooltip,
  placeholder,
  value,
  onChange,
  rows = 4,
  resize = 'vertical',
  containerProps,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const labelColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled} {...containerProps}>
      {label && (
        <FormLabel 
          color={labelColor} 
          fontWeight="semibold" 
          fontSize="sm"
          display="flex"
          alignItems="center"
          gap={2}
        >
          {label}
          {tooltip && (
            <Tooltip label={tooltip} placement="top" hasArrow>
              <Box as="span" cursor="help">
                <FaInfoCircle size={12} opacity={0.7} />
              </Box>
            </Tooltip>
          )}
        </FormLabel>
      )}
      
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        borderColor={borderColor}
        _hover={{ borderColor: focusBorderColor }}
        _focus={{ 
          borderColor: focusBorderColor,
          boxShadow: `0 0 0 1px ${focusBorderColor}`,
        }}
        borderRadius="lg"
        transition="all 0.2s"
        rows={rows}
        resize={resize}
      />
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Select Field
interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  size?: 'sm' | 'md' | 'lg';
}

export const ModernSelectField: React.FC<SelectFieldProps> = ({
  label,
  error,
  helperText,
  isRequired,
  isDisabled,
  tooltip,
  placeholder,
  value,
  onChange,
  options,
  size = 'md',
  containerProps,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const labelColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled} {...containerProps}>
      {label && (
        <FormLabel 
          color={labelColor} 
          fontWeight="semibold" 
          fontSize="sm"
          display="flex"
          alignItems="center"
          gap={2}
        >
          {label}
          {tooltip && (
            <Tooltip label={tooltip} placement="top" hasArrow>
              <Box as="span" cursor="help">
                <FaInfoCircle size={12} opacity={0.7} />
              </Box>
            </Tooltip>
          )}
        </FormLabel>
      )}
      
      <Select
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={size}
        borderColor={borderColor}
        _hover={{ borderColor: focusBorderColor }}
        _focus={{ 
          borderColor: focusBorderColor,
          boxShadow: `0 0 0 1px ${focusBorderColor}`,
        }}
        borderRadius="lg"
        transition="all 0.2s"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </Select>
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Number Field
interface NumberFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export const ModernNumberField: React.FC<NumberFieldProps> = ({
  label,
  error,
  helperText,
  isRequired,
  isDisabled,
  tooltip,
  placeholder,
  value,
  onChange,
  min,
  max,
  step,
  precision,
  containerProps,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const labelColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled} {...containerProps}>
      {label && (
        <FormLabel 
          color={labelColor} 
          fontWeight="semibold" 
          fontSize="sm"
          display="flex"
          alignItems="center"
          gap={2}
        >
          {label}
          {tooltip && (
            <Tooltip label={tooltip} placement="top" hasArrow>
              <Box as="span" cursor="help">
                <FaInfoCircle size={12} opacity={0.7} />
              </Box>
            </Tooltip>
          )}
        </FormLabel>
      )}
        <NumberInput
        value={value}
        onChange={(_, valueAsNumber) => onChange(valueAsNumber)}
        min={min}
        max={max}
        step={step}
        precision={precision}
      >
        <NumberInputField
          placeholder={placeholder}
          borderColor={borderColor}
          _hover={{ borderColor: focusBorderColor }}
          _focus={{ 
            borderColor: focusBorderColor,
            boxShadow: `0 0 0 1px ${focusBorderColor}`,
          }}
          borderRadius="lg"
          transition="all 0.2s"
        />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Checkbox Field
interface CheckboxFieldProps extends BaseFieldProps {
  children: React.ReactNode;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  colorScheme?: string;
}

export const ModernCheckboxField: React.FC<CheckboxFieldProps> = ({
  children,
  error,
  helperText,
  isDisabled,
  tooltip,
  isChecked,
  onChange,
  colorScheme = 'blue',
  containerProps,
}) => {
  return (
    <FormControl isInvalid={!!error} isDisabled={isDisabled} {...containerProps}>
      <Box display="flex" alignItems="center" gap={2}>
        <Checkbox
          isChecked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          colorScheme={colorScheme}
        >
          {children}
        </Checkbox>
        {tooltip && (
          <Tooltip label={tooltip} placement="top" hasArrow>
            <Box as="span" cursor="help">
              <FaInfoCircle size={12} opacity={0.7} />
            </Box>
          </Tooltip>
        )}
      </Box>
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Switch Field
interface SwitchFieldProps extends BaseFieldProps {
  children: React.ReactNode;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  colorScheme?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ModernSwitchField: React.FC<SwitchFieldProps> = ({
  children,
  error,
  helperText,
  isDisabled,
  tooltip,
  isChecked,
  onChange,
  colorScheme = 'blue',
  size = 'md',
  containerProps,
}) => {
  return (
    <FormControl isInvalid={!!error} isDisabled={isDisabled} {...containerProps}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <Text fontWeight="semibold" fontSize="sm">
            {children}
          </Text>
          {tooltip && (
            <Tooltip label={tooltip} placement="top" hasArrow>
              <Box as="span" cursor="help">
                <FaInfoCircle size={12} opacity={0.7} />
              </Box>
            </Tooltip>
          )}
        </Box>
        <Switch
          isChecked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          colorScheme={colorScheme}
          size={size}
        />
      </Box>
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Radio Group Field
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupFieldProps extends BaseFieldProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  direction?: 'row' | 'column';
  colorScheme?: string;
}

export const ModernRadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  error,
  helperText,
  isRequired,
  isDisabled,
  tooltip,
  options,
  value,
  onChange,
  direction = 'column',
  colorScheme = 'blue',
  containerProps,
}) => {
  const labelColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled} {...containerProps}>
      {label && (
        <FormLabel 
          color={labelColor} 
          fontWeight="semibold" 
          fontSize="sm"
          display="flex"
          alignItems="center"
          gap={2}
        >
          {label}
          {tooltip && (
            <Tooltip label={tooltip} placement="top" hasArrow>
              <Box as="span" cursor="help">
                <FaInfoCircle size={12} opacity={0.7} />
              </Box>
            </Tooltip>
          )}
        </FormLabel>
      )}
      
      <RadioGroup value={value} onChange={onChange} colorScheme={colorScheme}>
        <Stack direction={direction} spacing={3}>
          {options.map((option) => (
            <Radio key={option.value} value={option.value} isDisabled={option.disabled}>
              {option.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
      
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
