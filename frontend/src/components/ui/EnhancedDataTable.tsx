import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  VStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Spacer,
  ButtonGroup,
  Tooltip,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaDownload,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

// Column Configuration
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
}

// Table Action
export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactElement;
  onClick: (item: T, index: number) => void;
  isDisabled?: (item: T) => boolean;
  isVisible?: (item: T) => boolean;
  color?: string;
  variant?: 'ghost' | 'outline' | 'solid';
}

// Bulk Action
export interface BulkAction<T = any> {
  label: string;
  icon?: React.ReactElement;
  onClick: (selectedItems: T[]) => void;
  isDisabled?: (selectedItems: T[]) => boolean;
  color?: string;
  variant?: 'ghost' | 'outline' | 'solid';
}

// Filter Option
export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Sort Configuration
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Enhanced Data Table Props
interface EnhancedDataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  
  // Pagination
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
    showSizeChanger?: boolean;
    pageSizeOptions?: string[];
    showQuickJumper?: boolean;
    showTotal?: (total: number, range: [number, number]) => string;
  };
  
  // Selection
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
    onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  };
  
  // Actions
  actions?: TableAction<T>[];
  bulkActions?: BulkAction<T>[];
  
  // Search & Filter
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  
  // Sorting
  defaultSort?: SortConfig;
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'simple' | 'striped' | 'unstyled';
  colorScheme?: string;
  
  // Header Actions
  headerActions?: React.ReactNode;
  title?: string;
  subtitle?: string;
  
  // Empty State
  emptyState?: React.ReactNode;
  
  // Row Props
  onRowClick?: (record: T, index: number) => void;
  rowKey?: string | ((record: T) => string);
  
  // Export
  exportable?: boolean;
  onExport?: (data: T[]) => void;
  
  // Refresh
  refreshable?: boolean;
  onRefresh?: () => void;
}

export const EnhancedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  pagination,
  rowSelection,
  actions,
  bulkActions,
  searchable = true,
  searchPlaceholder = 'Search...',
  filters,
  defaultSort,
  size = 'md',
  variant = 'simple',
  colorScheme = 'blue',
  headerActions,
  title,
  subtitle,
  emptyState,
  onRowClick,
  rowKey = 'id',
  exportable = false,
  onExport,
  refreshable = false,
  onRefresh,
}: EnhancedDataTableProps<T>) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<T[]>([]);

  // Color mode values
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (itemValue === undefined || itemValue === null) return false;
          return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, filterValues, sortConfig, columns]);

  // Handle row selection
  const handleRowSelection = (item: T, selected: boolean) => {
    if (selected) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter(selectedItem => 
        getRowKey(selectedItem, 0) !== getRowKey(item, 0)
      ));
    }
    
    if (rowSelection?.onChange) {
      const newSelectedItems = selected 
        ? [...selectedItems, item]
        : selectedItems.filter(selectedItem => 
            getRowKey(selectedItem, 0) !== getRowKey(item, 0)
          );
      
      const selectedKeys = newSelectedItems.map((item, index) => getRowKey(item, index));
      rowSelection.onChange(selectedKeys, newSelectedItems);
    }
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(processedData);
      if (rowSelection?.onChange) {
        const selectedKeys = processedData.map((item, index) => getRowKey(item, index));
        rowSelection.onChange(selectedKeys, processedData);
      }
    } else {
      setSelectedItems([]);
      if (rowSelection?.onChange) {
        rowSelection.onChange([], []);
      }
    }
  };

  // Check if all rows are selected
  const isAllSelected = processedData.length > 0 && selectedItems.length === processedData.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < processedData.length;

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <FaSort opacity={0.5} />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Render empty state
  const renderEmptyState = () => {
    if (emptyState) {
      return emptyState;
    }
    
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500" fontSize="lg">
          No data available
        </Text>
        <Text color="gray.400" fontSize="sm" mt={2}>
          {searchTerm || Object.keys(filterValues).length > 0
            ? 'No results match your search criteria'
            : 'There are no records to display'
          }
        </Text>
      </Box>
    );
  };

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Card bg={bg} borderColor={borderColor} borderWidth={1} borderRadius="xl" overflow="hidden">
      {/* Header */}
      {(title || subtitle || headerActions || searchable || refreshable || exportable) && (
        <CardHeader>
          <VStack spacing={4} align="stretch">
            {/* Title Row */}
            {(title || subtitle || headerActions) && (
              <Flex align="center">
                <Box>
                  {title && (
                    <Heading size="md" mb={1}>
                      {title}
                    </Heading>
                  )}
                  {subtitle && (
                    <Text color="gray.500" fontSize="sm">
                      {subtitle}
                    </Text>
                  )}
                </Box>
                <Spacer />
                {headerActions}
              </Flex>
            )}

            {/* Search and Actions Row */}
            {(searchable || refreshable || exportable || filters) && (
              <Flex wrap="wrap" gap={4} align="center">
                {/* Search */}
                {searchable && (
                  <InputGroup maxW="300px">
                    <InputLeftElement>
                      <FaSearch color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="sm"
                    />
                  </InputGroup>
                )}

                {/* Filters */}
                {filters && filters.map((filter) => (
                  <Box key={filter.key} minW="150px">
                    {filter.type === 'select' ? (
                      <Select
                        placeholder={filter.placeholder || `Filter by ${filter.label}`}
                        value={filterValues[filter.key] || ''}
                        onChange={(e) => setFilterValues(prev => ({
                          ...prev,
                          [filter.key]: e.target.value,
                        }))}
                        size="sm"
                      >
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        placeholder={filter.placeholder || `Filter by ${filter.label}`}
                        value={filterValues[filter.key] || ''}
                        onChange={(e) => setFilterValues(prev => ({
                          ...prev,
                          [filter.key]: e.target.value,
                        }))}
                        size="sm"
                      />
                    )}
                  </Box>
                ))}

                <Spacer />

                {/* Action Buttons */}
                <ButtonGroup size="sm" variant="outline">
                  {refreshable && (
                    <Tooltip label="Refresh">
                      <IconButton
                        aria-label="Refresh"
                        icon={<FaSync />}
                        onClick={onRefresh}
                        isLoading={loading}
                      />
                    </Tooltip>
                  )}
                  
                  {exportable && (
                    <Tooltip label="Export">
                      <IconButton
                        aria-label="Export"
                        icon={<FaDownload />}
                        onClick={() => onExport?.(processedData)}
                      />
                    </Tooltip>
                  )}
                </ButtonGroup>
              </Flex>
            )}

            {/* Bulk Actions */}
            {bulkActions && selectedItems.length > 0 && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {selectedItems.length} item(s) selected
                </Text>
                <ButtonGroup size="sm" variant="outline">                  {bulkActions.map((action, index) => (
                    <Button
                      key={index}
                      leftIcon={action.icon || undefined}
                      onClick={() => action.onClick(selectedItems)}
                      isDisabled={action.isDisabled?.(selectedItems)}
                      colorScheme={action.color}
                      variant={action.variant}
                    >
                      {action.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>
            )}
          </VStack>
        </CardHeader>
      )}

      {/* Table */}
      <CardBody p={0}>
        <TableContainer>
          <Table variant={variant} size={size} colorScheme={colorScheme}>
            <Thead bg={headerBg}>
              <Tr>
                {/* Selection Column */}
                {rowSelection && (
                  <Th w={10}>
                    <Checkbox
                      isChecked={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </Th>
                )}

                {/* Data Columns */}
                {columns.map((column) => (
                  <Th
                    key={column.key}
                    width={column.width}
                    minWidth={column.minWidth}
                    textAlign={column.headerAlign || column.align}
                    cursor={column.sortable ? 'pointer' : 'default'}
                    onClick={() => column.sortable && handleSort(column.key)}
                    _hover={column.sortable ? { bg: hoverBg } : undefined}
                  >
                    <HStack spacing={2} justify={column.headerAlign || column.align || 'left'}>
                      <Text>{column.label}</Text>
                      {column.sortable && renderSortIcon(column.key)}
                    </HStack>
                  </Th>
                ))}

                {/* Actions Column */}
                {actions && actions.length > 0 && (
                  <Th w={10} textAlign="center">
                    Actions
                  </Th>
                )}
              </Tr>
            </Thead>

            {loading ? (
              <Tbody>
                <Tr>
                  <Td colSpan={columns.length + (rowSelection ? 1 : 0) + (actions ? 1 : 0)}>
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" color={`${colorScheme}.500`} />
                      <Text mt={4} color="gray.500">Loading...</Text>
                    </Box>
                  </Td>
                </Tr>
              </Tbody>
            ) : processedData.length === 0 ? (
              <Tbody>
                <Tr>
                  <Td colSpan={columns.length + (rowSelection ? 1 : 0) + (actions ? 1 : 0)}>
                    {renderEmptyState()}
                  </Td>
                </Tr>
              </Tbody>
            ) : (
              <Tbody>
                {processedData.map((item, index) => {
                  const itemKey = getRowKey(item, index);
                  const isSelected = selectedItems.some(selectedItem => 
                    getRowKey(selectedItem, 0) === itemKey
                  );

                  return (
                    <Tr
                      key={itemKey}
                      cursor={onRowClick ? 'pointer' : 'default'}
                      onClick={() => onRowClick?.(item, index)}
                      _hover={{ bg: hoverBg }}
                    >
                      {/* Selection Cell */}
                      {rowSelection && (
                        <Td>
                          <Checkbox
                            isChecked={isSelected}
                            onChange={(e) => handleRowSelection(item, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            {...rowSelection.getCheckboxProps?.(item)}
                          />
                        </Td>
                      )}

                      {/* Data Cells */}
                      {columns.map((column) => (
                        <Td
                          key={column.key}
                          textAlign={column.align}
                          width={column.width}
                          minWidth={column.minWidth}
                        >
                          {column.render
                            ? column.render(item[column.key], item, index)
                            : item[column.key]
                          }
                        </Td>
                      ))}

                      {/* Actions Cell */}
                      {actions && actions.length > 0 && (
                        <Td textAlign="center">
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <MenuList>
                              {actions                                .filter(action => !action.isVisible || action.isVisible(item))
                                .map((action, actionIndex) => (
                                  <MenuItem
                                    key={actionIndex}
                                    icon={action.icon || undefined}
                                    onClick={() => action.onClick(item, index)}
                                    isDisabled={action.isDisabled?.(item)}
                                    color={action.color}
                                  >
                                    {action.label}
                                  </MenuItem>
                                ))
                              }
                            </MenuList>
                          </Menu>
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </Tbody>
            )}
          </Table>
        </TableContainer>
      </CardBody>

      {/* Footer with Pagination */}
      {pagination && (
        <CardFooter>
          <Flex w="full" align="center" justify="space-between">
            <Text fontSize="sm" color="gray.500">
              {pagination.showTotal
                ? pagination.showTotal(pagination.total, [
                    (pagination.current - 1) * pagination.pageSize + 1,
                    Math.min(pagination.current * pagination.pageSize, pagination.total),
                  ])
                : `Showing ${(pagination.current - 1) * pagination.pageSize + 1}-${Math.min(
                    pagination.current * pagination.pageSize,
                    pagination.total
                  )} of ${pagination.total} entries`
              }
            </Text>

            <HStack spacing={2}>
              {/* Page Size Selector */}
              {pagination.showSizeChanger && (
                <HStack>
                  <Text fontSize="sm">Show:</Text>
                  <Select
                    size="sm"
                    value={pagination.pageSize}
                    onChange={(e) => pagination.onChange(1, parseInt(e.target.value))}
                    width="auto"
                  >
                    {(pagination.pageSizeOptions || ['10', '20', '50', '100']).map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}

              {/* Pagination Controls */}
              <ButtonGroup size="sm" variant="outline">
                <IconButton
                  aria-label="Previous page"
                  icon={<FaChevronLeft />}
                  isDisabled={pagination.current === 1}
                  onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                />
                
                {/* Page Numbers */}
                {Array.from(
                  { length: Math.ceil(pagination.total / pagination.pageSize) },
                  (_, i) => i + 1
                )
                  .filter(page => {
                    const current = pagination.current;
                    return (
                      page === 1 ||
                      page === Math.ceil(pagination.total / pagination.pageSize) ||
                      (page >= current - 2 && page <= current + 2)
                    );
                  })
                  .map((page, index, pages) => {
                    const showEllipsis = index > 0 && page - pages[index - 1] > 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <Button size="sm" variant="ghost" isDisabled>
                            ...
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={page === pagination.current ? 'solid' : 'outline'}
                          colorScheme={page === pagination.current ? colorScheme : 'gray'}
                          onClick={() => pagination.onChange(page, pagination.pageSize)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })
                }
                
                <IconButton
                  aria-label="Next page"
                  icon={<FaChevronRight />}
                  isDisabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                />
              </ButtonGroup>
            </HStack>
          </Flex>
        </CardFooter>
      )}
    </Card>
  );
};
