import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardHeader,
  CardBody,
  Text,
  HStack,
  Badge,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Flex,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { FiMoreHorizontal, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Action {
  label: string;
  icon: React.ReactElement;
  onClick: (row: any) => void;
  color?: string;
}

interface ModernTableProps {
  title: string;
  columns: Column[];
  data: any[];
  actions?: Action[];
  loading?: boolean;
  emptyMessage?: string;
}

const ModernTable: React.FC<ModernTableProps> = ({
  title,
  columns,
  data,
  actions,
  loading = false,
  emptyMessage = 'No data available',
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const renderCellContent = (column: Column, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }

    // Default rendering for common data types
    if (column.key === 'avatar' || column.key === 'profilePicture') {
      return (
        <Avatar
          size="sm"
          name={row.name || `${row.firstName} ${row.lastName}`}
          src={value}
        />
      );
    }

    if (column.key === 'status') {
      const colorScheme = 
        value === 'active' || value === 'approved' ? 'green' :
        value === 'pending' ? 'yellow' :
        value === 'inactive' || value === 'rejected' ? 'red' : 'gray';
      
      return (
        <Badge colorScheme={colorScheme} variant="subtle">
          {value}
        </Badge>
      );
    }

    if (column.key === 'role') {
      return (
        <Badge colorScheme="blue" variant="subtle">
          {value}
        </Badge>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Badge colorScheme={value ? 'green' : 'red'} variant="subtle">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (column.key.includes('date') || column.key.includes('Date')) {
      return value ? new Date(value).toLocaleDateString() : '-';
    }

    if (column.key.includes('amount') || column.key.includes('Amount')) {
      return typeof value === 'number' ? `₦${value.toLocaleString()}` : value;
    }

    return value || '-';
  };

  if (loading) {
    return (
      <Card bg={cardBg} shadow="sm" borderRadius="xl">
        <CardHeader pb={0}>
          <Skeleton height="20px" width="200px" />
        </CardHeader>
        <CardBody>
          <Box>
            {[...Array(5)].map((_, i) => (
              <Flex key={i} mb={4} gap={4}>
                <Skeleton height="40px" width="40px" borderRadius="full" />
                <SkeletonText noOfLines={2} spacing="2" flex={1} />
              </Flex>
            ))}
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} shadow="sm" borderRadius="xl">
      <CardHeader>
        <Text fontSize="lg" fontWeight="600">
          {title}
        </Text>
      </CardHeader>
      <CardBody pt={0}>
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead bg={headerBg}>
              <Tr>
                {columns.map((column) => (
                  <Th
                    key={column.key}
                    borderColor={borderColor}
                    fontSize="xs"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {column.label}
                  </Th>
                ))}
                {actions && actions.length > 0 && (
                  <Th borderColor={borderColor} width="50px">
                    Actions
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {data.length === 0 ? (
                <Tr>
                  <Td colSpan={columns.length + (actions ? 1 : 0)} textAlign="center" py={8}>
                    <Text color="gray.500">{emptyMessage}</Text>
                  </Td>
                </Tr>
              ) : (
                data.map((row, index) => (
                  <Tr key={row.id || index} _hover={{ bg: headerBg }}>
                    {columns.map((column) => (
                      <Td key={column.key} borderColor={borderColor}>
                        {renderCellContent(column, row)}
                      </Td>
                    ))}
                    {actions && actions.length > 0 && (
                      <Td borderColor={borderColor}>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<FiMoreHorizontal />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            {actions.map((action, actionIndex) => (
                              <MenuItem
                                key={actionIndex}
                                icon={action.icon}
                                onClick={() => action.onClick(row)}
                                color={action.color}
                              >
                                {action.label}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </Menu>
                      </Td>
                    )}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </CardBody>
    </Card>
  );
};

export default ModernTable;
