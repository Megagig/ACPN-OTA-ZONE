import React, { useState, useMemo } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  HStack,
  VStack,
  Text,
  Button,
  Checkbox,
  Select,
  Flex,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  Heading,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaDownload,
  FaSync,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MotionTr = motion(Tr);
const MotionBox = motion(Box);

// Column Definition
export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: keyof T | ((item: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => React.ReactNode;
  filterType?: 'text' | 'select' | 'number' | 'date' | 'boolean';
  filterOptions?: Array<{ label: string; value: any }>;
}

// Table Props
interface EnhancedTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (item: T) => void;
    colorScheme?: string;
    variant?: string;
    isDisabled?: (item: T) => boolean;
  }>;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => void;
    colorScheme?: string;
    variant?: string;
  }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  headerActions?: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRefresh?: () => void;  onExport?: () => void;
  maxHeight?: string;
  variant?: 'simple' | 'striped' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
}

export const EnhancedTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  title,
  subtitle,
  searchable = true,
  searchPlaceholder = 'Search...',
  filterable = true,
  sortable = true,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  actions = [],
  bulkActions = [],
  pagination,
  headerActions,  emptyMessage = 'No data available',
  emptyIcon = <FaSearch />,
  onRefresh,
  onExport,
  maxHeight = '600px',
  variant = 'simple',
  size = 'md',
  colorScheme = 'blue',
}: EnhancedTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Process data with search, filter, and sort
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      result = result.filter((item) =>
        columns.some((column) => {
          const value = column.accessor
            ? typeof column.accessor === 'function'
              ? column.accessor(item)
              : item[column.accessor]
            : item[column.key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Filter
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue !== undefined && filterValue !== '') {
        result = result.filter((item) => {
          const column = columns.find((col) => col.key === key);
          if (!column) return true;
          
          const value = column.accessor
            ? typeof column.accessor === 'function'
              ? column.accessor(item)
              : item[column.accessor]
            : item[column.key];
          
          if (column.filterType === 'boolean') {
            return Boolean(value) === Boolean(filterValue);
          }
          
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        });
      }
    });

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const column = columns.find((col) => col.key === sortConfig.key);
        if (!column) return 0;
        
        const aValue = column.accessor
          ? typeof column.accessor === 'function'
            ? column.accessor(a)
            : a[column.accessor]
          : a[column.key];
        const bValue = column.accessor
          ? typeof column.accessor === 'function'
            ? column.accessor(b)
            : b[column.accessor]
          : b[column.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, columns]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig((prevConfig) => {
      if (prevConfig?.key === key) {
        return prevConfig.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? processedData : []);
  };

  const handleSelectRow = (item: T, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelection = checked
      ? [...selectedRows, item]
      : selectedRows.filter((row) => row !== item);
    
    onSelectionChange(newSelection);
  };

  const isSelected = (item: T) => {
    return selectedRows.some((row) => row === item);
  };

  const allSelected = processedData.length > 0 && processedData.every(isSelected);
  const someSelected = processedData.some(isSelected);

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Card bg={bg} borderColor={borderColor} borderRadius="xl" overflow="hidden">
      {(title || subtitle || headerActions || searchable) && (
        <CardHeader>
          <VStack spacing={4} align="stretch">
            <Flex align="center" justify="space-between">
              <VStack align="start" spacing={1}>
                {title && (
                  <Heading size="md" fontWeight="semibold">
                    {title}
                  </Heading>
                )}
                {subtitle && (
                  <Text fontSize="sm" color="gray.600">
                    {subtitle}
                  </Text>
                )}
              </VStack>
              <HStack spacing={2}>                {onRefresh && (
                  <Tooltip label="Refresh">
                    <IconButton
                      aria-label="Refresh"
                      icon={<FaSync />}
                      size="sm"
                      variant="ghost"
                      onClick={onRefresh}
                    />
                  </Tooltip>
                )}
                {onExport && (
                  <Tooltip label="Export">
                    <IconButton
                      aria-label="Export"
                      icon={<FaDownload />}
                      size="sm"
                      variant="ghost"
                      onClick={onExport}
                    />
                  </Tooltip>
                )}
                {filterable && (
                  <Tooltip label="Toggle Filters">
                    <IconButton
                      aria-label="Toggle Filters"
                      icon={<FaFilter />}
                      size="sm"
                      variant={showFilters ? 'solid' : 'ghost'}
                      colorScheme={showFilters ? colorScheme : 'gray'}
                      onClick={() => setShowFilters(!showFilters)}
                    />
                  </Tooltip>
                )}
                {headerActions}
              </HStack>
            </Flex>

            <HStack spacing={4}>
              {searchable && (
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <FaSearch opacity={0.5} />
                  </InputLeftElement>
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="lg"
                  />
                  {searchTerm && (
                    <InputRightElement>
                      <IconButton
                        aria-label="Clear search"
                        icon={<FaTimes />}
                        size="xs"
                        variant="ghost"
                        onClick={() => setSearchTerm('')}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              )}

              {bulkActions.length > 0 && selectedRows.length > 0 && (
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    {selectedRows.length} selected
                  </Text>                  {bulkActions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      leftIcon={action.icon as any}
                      colorScheme={action.colorScheme}
                      variant={action.variant || 'outline'}
                      onClick={() => action.onClick(selectedRows)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </HStack>
              )}
            </HStack>

            <AnimatePresence>
              {showFilters && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box p={4} bg={headerBg} borderRadius="lg">
                    <HStack spacing={4} flexWrap="wrap">
                      {columns
                        .filter((col) => col.filterable)
                        .map((column) => (
                          <Box key={column.key} minW="200px">
                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                              {column.header}
                            </Text>
                            {column.filterType === 'select' && column.filterOptions ? (
                              <Select
                                placeholder="All"
                                size="sm"
                                value={filters[column.key] || ''}
                                onChange={(e) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    [column.key]: e.target.value,
                                  }))
                                }
                              >
                                {column.filterOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <Input
                                size="sm"
                                placeholder={`Filter ${column.header}`}
                                value={filters[column.key] || ''}
                                onChange={(e) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    [column.key]: e.target.value,
                                  }))
                                }
                              />
                            )}
                          </Box>
                        ))}
                    </HStack>
                  </Box>
                </MotionBox>
              )}
            </AnimatePresence>
          </VStack>
        </CardHeader>
      )}

      <CardBody p={0}>
        <TableContainer maxHeight={maxHeight} overflowY="auto">
          <Table variant={variant} size={size}>
            <Thead bg={headerBg} position="sticky" top={0} zIndex={1}>
              <Tr>
                {selectable && (
                  <Th w="50px">
                    <Checkbox
                      isChecked={allSelected}
                      isIndeterminate={someSelected && !allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </Th>
                )}
                {columns.map((column) => (
                  <Th
                    key={column.key}
                    cursor={column.sortable && sortable ? 'pointer' : 'default'}
                    onClick={() => column.sortable && handleSort(column.key)}
                    width={column.width}
                    minWidth={column.minWidth}
                    maxWidth={column.maxWidth}
                    textAlign={column.align}
                    userSelect="none"
                  >
                    <HStack spacing={2} justify={column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'}>
                      <Text>{column.header}</Text>
                      {column.sortable && sortable && (
                        <Box>
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort opacity={0.5} />
                          )}
                        </Box>
                      )}
                    </HStack>
                  </Th>
                ))}
                {actions.length > 0 && (
                  <Th w="100px" textAlign="center">
                    Actions
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Tr key={index}>
                    {selectable && (
                      <Td>
                        <Skeleton height="20px" width="20px" />
                      </Td>
                    )}
                    {columns.map((column) => (
                      <Td key={column.key}>
                        <Skeleton height="20px" />
                      </Td>
                    ))}
                    {actions.length > 0 && (
                      <Td>
                        <Skeleton height="20px" />
                      </Td>
                    )}
                  </Tr>
                ))
              ) : processedData.length === 0 ? (
                <Tr>
                  <Td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}>
                    <VStack spacing={4} py={8}>
                      <Box fontSize="3xl" opacity={0.5}>
                        {emptyIcon}
                      </Box>
                      <Text color="gray.500">{emptyMessage}</Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                <AnimatePresence>
                  {processedData.map((item, index) => (
                    <MotionTr
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      _hover={{ bg: hoverBg }}
                      bg={isSelected(item) ? `${colorScheme}.50` : 'transparent'}
                    >
                      {selectable && (
                        <Td>
                          <Checkbox
                            isChecked={isSelected(item)}
                            onChange={(e) => handleSelectRow(item, e.target.checked)}
                          />
                        </Td>
                      )}
                      {columns.map((column) => {
                        const value = column.accessor
                          ? typeof column.accessor === 'function'
                            ? column.accessor(item)
                            : item[column.accessor]
                          : item[column.key];

                        return (
                          <Td key={column.key} textAlign={column.align}>
                            {column.render ? column.render(value, item, index) : String(value)}
                          </Td>
                        );
                      })}
                      {actions.length > 0 && (
                        <Td>
                          <HStack spacing={1} justify="center">
                            {actions.map((action, actionIndex) => (
                              <Tooltip key={actionIndex} label={action.label}>                                <IconButton
                                  aria-label={action.label}
                                  icon={action.icon as any}
                                  size="sm"
                                  variant={action.variant || 'ghost'}
                                  colorScheme={action.colorScheme}
                                  onClick={() => action.onClick(item)}
                                  isDisabled={action.isDisabled?.(item)}
                                />
                              </Tooltip>
                            ))}
                          </HStack>
                        </Td>
                      )}
                    </MotionTr>
                  ))}
                </AnimatePresence>
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {pagination && (
          <Box p={4} borderTop="1px" borderColor={borderColor}>
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                  {pagination.totalItems} entries
                </Text>
                <HStack>
                  <Text fontSize="sm">Show:</Text>
                  <Select
                    size="sm"
                    value={pagination.pageSize}
                    onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                    width="80px"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Select>
                </HStack>
              </HStack>
              
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  isDisabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === pagination.currentPage ? 'solid' : 'outline'}
                      colorScheme={page === pagination.currentPage ? colorScheme : 'gray'}
                      onClick={() => pagination.onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  isDisabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};
