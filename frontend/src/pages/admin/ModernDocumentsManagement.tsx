import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Icon,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tag,
  TagLabel,
  Progress,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiFile,
  FiFilePlus,
  FiDownload,
  FiUpload,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiFolder,
  FiFolderPlus,
  FiShare2,
  FiLock,
  FiUser,
  FiCalendar,
  FiArchive,
  FiStar,
  FiHeart,
  FiImage,
  FiVideo,
  FiMusic,
} from 'react-icons/fi';

interface Document {
  id: string;
  name: string;
  description?: string;
  type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'image' | 'video' | 'other';
  category: string;
  size: number; // in bytes
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  version: number;
  status: 'active' | 'archived' | 'draft';
  isPublic: boolean;
  downloadCount: number;
  tags: string[];
  folderId?: string;
  isFavorite: boolean;
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
  };
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  documentCount: number;
  isPublic: boolean;
}

const ModernDocumentsManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFolderOpen, onOpen: onFolderOpen, onClose: onFolderClose } = useDisclosure();  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  // Mock data
  const [folders] = useState<Folder[]>([
    {
      id: 'f1',
      name: 'Policies & Procedures',
      description: 'Official zone policies and procedural documents',
      createdBy: 'Admin Team',
      createdAt: '2024-01-01',
      documentCount: 15,
      isPublic: false,
    },
    {
      id: 'f2',
      name: 'Meeting Minutes',
      description: 'Records of all official meetings',
      createdBy: 'Secretary',
      createdAt: '2024-01-01',
      documentCount: 24,
      isPublic: true,
    },
    {
      id: 'f3',
      name: 'Educational Materials',
      description: 'CPD resources and training materials',
      createdBy: 'Education Committee',
      createdAt: '2024-01-01',
      documentCount: 32,
      isPublic: true,
    },
    {
      id: 'f4',
      name: 'Financial Reports',
      description: 'Financial statements and budget reports',
      createdBy: 'Treasurer',
      createdAt: '2024-01-01',
      documentCount: 18,
      isPublic: false,
    },
    {
      id: 'f5',
      name: 'Event Resources',
      description: 'Materials and resources for zone events',
      createdBy: 'Event Committee',
      createdAt: '2024-01-01',
      documentCount: 28,
      isPublic: true,
    },
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Zone Constitution 2024',
      description: 'Updated constitution and bylaws for ACPN Ota Zone',
      type: 'pdf',
      category: 'Policies',
      size: 2048576, // 2MB
      uploadedBy: 'Legal Committee',
      uploadedAt: '2024-02-01',
      lastModified: '2024-02-15',
      version: 3,
      status: 'active',
      isPublic: true,
      downloadCount: 145,
      tags: ['constitution', 'bylaws', 'governance'],
      folderId: 'f1',
      isFavorite: true,
      permissions: {
        canView: ['all'],
        canEdit: ['admin', 'legal-committee'],
        canDelete: ['admin'],
      },
    },
    {
      id: '2',
      name: 'February 2024 General Meeting Minutes',
      description: 'Minutes from the February monthly general meeting',
      type: 'docx',
      category: 'Minutes',
      size: 512000, // 500KB
      uploadedBy: 'Secretary',
      uploadedAt: '2024-02-20',
      lastModified: '2024-02-20',
      version: 1,
      status: 'active',
      isPublic: true,
      downloadCount: 89,
      tags: ['meeting', 'minutes', 'february'],
      folderId: 'f2',
      isFavorite: false,
      permissions: {
        canView: ['all'],
        canEdit: ['secretary'],
        canDelete: ['admin', 'secretary'],
      },
    },
    {
      id: '3',
      name: 'CPD Workshop Presentation - Clinical Pharmacy',
      description: 'Slide deck from the clinical pharmacy CPD workshop',
      type: 'pptx',
      category: 'Education',
      size: 15728640, // 15MB
      uploadedBy: 'Dr. Adebayo Smith',
      uploadedAt: '2024-02-28',
      lastModified: '2024-02-28',
      version: 1,
      status: 'active',
      isPublic: true,
      downloadCount: 67,
      tags: ['cpd', 'clinical-pharmacy', 'workshop'],
      folderId: 'f3',
      isFavorite: true,
      permissions: {
        canView: ['all'],
        canEdit: ['dr-adebayo'],
        canDelete: ['admin', 'dr-adebayo'],
      },
    },
    {
      id: '4',
      name: '2023 Annual Financial Report',
      description: 'Comprehensive financial report for the year 2023',
      type: 'pdf',
      category: 'Financial',
      size: 3145728, // 3MB
      uploadedBy: 'Treasurer',
      uploadedAt: '2024-01-31',
      lastModified: '2024-01-31',
      version: 2,
      status: 'active',
      isPublic: false,
      downloadCount: 45,
      tags: ['financial', 'annual-report', '2023'],
      folderId: 'f4',
      isFavorite: false,
      permissions: {
        canView: ['executives', 'treasurer'],
        canEdit: ['treasurer'],
        canDelete: ['admin', 'treasurer'],
      },
    },
    {
      id: '5',
      name: 'Conference Venue Contract',
      description: 'Signed contract for 2024 annual conference venue',
      type: 'pdf',
      category: 'Contracts',
      size: 1048576, // 1MB
      uploadedBy: 'Event Committee',
      uploadedAt: '2024-02-10',
      lastModified: '2024-02-10',
      version: 1,
      status: 'active',
      isPublic: false,
      downloadCount: 12,
      tags: ['contract', 'venue', 'conference'],
      folderId: 'f5',
      isFavorite: false,
      permissions: {
        canView: ['executives', 'event-committee'],
        canEdit: ['event-committee'],
        canDelete: ['admin'],
      },
    },
    {
      id: '6',
      name: 'Member Registration Form Template',
      description: 'Standardized form template for new member registration',
      type: 'docx',
      category: 'Templates',
      size: 256000, // 250KB
      uploadedBy: 'Membership Committee',
      uploadedAt: '2024-01-15',
      lastModified: '2024-02-01',
      version: 2,
      status: 'active',
      isPublic: true,
      downloadCount: 234,
      tags: ['template', 'registration', 'membership'],
      isFavorite: true,
      permissions: {
        canView: ['all'],
        canEdit: ['membership-committee'],
        canDelete: ['admin'],
      },
    },
  ]);

  const categories = [
    'Policies',
    'Minutes',
    'Education',
    'Financial',
    'Contracts',
    'Templates',
    'Reports',
    'Forms',
    'Presentations',
    'Other',
  ];

  const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'image', 'video', 'other'];

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(documents.filter(d => d.id !== documentId));
    toast({
      title: 'Document deleted',
      description: 'The document has been successfully deleted.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  const handleCreateFolder = () => {
    setIsEditing(false);
    onFolderOpen();
  };

  const handleToggleFavorite = (documentId: string) => {
    setDocuments(documents.map(doc =>
      doc.id === documentId
        ? { ...doc, isFavorite: !doc.isFavorite }
        : doc
    ));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return FiFileText;
      case 'xls':
      case 'xlsx':
        return FiFile;
      case 'ppt':
      case 'pptx':
        return FiFile;
      case 'image':
        return FiImage;
      case 'video':
        return FiVideo;
      case 'audio':
        return FiMusic;
      default:
        return FiFile;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'red';
      case 'doc':
      case 'docx': return 'blue';
      case 'xls':
      case 'xlsx': return 'green';
      case 'ppt':
      case 'pptx': return 'orange';
      case 'image': return 'purple';
      case 'video': return 'pink';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || document.category === filterCategory;
    const matchesType = filterType === 'all' || document.type === filterType;
    const matchesFolder = currentFolder === null || document.folderId === currentFolder;
    
    return matchesSearch && matchesCategory && matchesType && matchesFolder;
  });

  const getDocumentStats = () => {
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const publicDocuments = documents.filter(d => d.isPublic).length;
    const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloadCount, 0);
    
    return { totalDocuments, totalSize, publicDocuments, totalDownloads };
  };

  const stats = getDocumentStats();

  const DocumentCard: React.FC<{ document: Document }> = ({ document }) => (
    <Card bg={cardBg} shadow="sm" borderRadius="xl" border="1px" borderColor={borderColor}>
      <CardHeader pb={2}>
        <Flex justify="space-between" align="start">
          <HStack spacing={3} flex={1}>
            <Icon 
              as={getFileIcon(document.type)} 
              boxSize={8} 
              color={`${getTypeColor(document.type)}.500`}
            />
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="sm" color="gray.800" noOfLines={1}>
                {document.name}
              </Heading>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme={getTypeColor(document.type)} size="sm">
                  {document.type.toUpperCase()}
                </Badge>
                <Badge variant="outline" size="sm">
                  v{document.version}
                </Badge>
                {!document.isPublic && (
                  <Badge colorScheme="red" size="sm">
                    <Icon as={FiLock} mr={1} />
                    Private
                  </Badge>
                )}
                {document.isFavorite && (
                  <Icon as={FiStar} color="yellow.500" />
                )}
              </HStack>
            </VStack>
          </HStack>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<Icon as={FiMoreVertical} />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem icon={<Icon as={FiEye} />}>View</MenuItem>
              <MenuItem icon={<Icon as={FiDownload} />}>Download</MenuItem>
              <MenuItem icon={<Icon as={FiEdit3} />} onClick={() => handleEditDocument(document)}>
                Edit
              </MenuItem>
              <MenuItem icon={<Icon as={FiShare2} />}>Share</MenuItem>
              <MenuItem 
                icon={<Icon as={document.isFavorite ? FiHeart : FiStar} />}
                onClick={() => handleToggleFavorite(document.id)}
              >
                {document.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </MenuItem>
              <Divider />
              <MenuItem icon={<Icon as={FiArchive} />}>Archive</MenuItem>
              <MenuItem 
                icon={<Icon as={FiTrash2} />} 
                color="red.500"
                onClick={() => handleDeleteDocument(document.id)}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          {document.description && (
            <Text fontSize="sm" color={textColor} noOfLines={2}>
              {document.description}
            </Text>
          )}
          
          <VStack align="start" spacing={2} w="full">
            <HStack spacing={4}>
              <HStack spacing={1}>
                <Icon as={FiUser} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>
                  {document.uploadedBy}
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiCalendar} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </Text>
              </HStack>
            </HStack>
            
            <HStack spacing={4}>
              <Text fontSize="sm" color={textColor}>
                {formatFileSize(document.size)}
              </Text>
              <Text fontSize="sm" color={textColor}>
                {document.downloadCount} downloads
              </Text>
            </HStack>
          </VStack>

          {/* Tags */}
          {document.tags.length > 0 && (
            <HStack spacing={1} flexWrap="wrap">
              {document.tags.slice(0, 3).map((tag) => (
                <Tag key={tag} size="sm" colorScheme="blue" variant="subtle">
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              ))}
              {document.tags.length > 3 && (
                <Text fontSize="xs" color={textColor}>
                  +{document.tags.length - 3} more
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  const FolderCard: React.FC<{ folder: Folder }> = ({ folder }) => (
    <Card 
      bg={cardBg} 
      shadow="sm" 
      borderRadius="xl" 
      border="1px" 
      borderColor={borderColor}
      cursor="pointer"
      _hover={{ shadow: 'md' }}
      onClick={() => setCurrentFolder(folder.id)}
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <HStack spacing={3}>
              <Icon as={FiFolder} boxSize={8} color="blue.500" />
              <VStack align="start" spacing={1}>
                <Heading size="sm" color="gray.800">
                  {folder.name}
                </Heading>
                <HStack spacing={2}>
                  <Badge variant="outline" size="sm">
                    {folder.documentCount} docs
                  </Badge>
                  {folder.isPublic && (
                    <Badge colorScheme="green" size="sm">
                      Public
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
            <IconButton
              icon={<Icon as={FiMoreVertical} />}
              variant="ghost"
              size="sm"
              aria-label="Folder options"
              onClick={(e) => {
                e.stopPropagation();
                // Handle folder menu
              }}
            />
          </HStack>
          
          {folder.description && (
            <Text fontSize="sm" color={textColor} noOfLines={2}>
              {folder.description}
            </Text>
          )}
          
          <HStack spacing={1}>
            <Icon as={FiUser} color={textColor} size="sm" />
            <Text fontSize="sm" color={textColor}>
              Created by {folder.createdBy}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Box p={6} bg={bg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <HStack>
              {currentFolder && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFolder(null)}
                  leftIcon={<Icon as={FiFolder} />}
                >
                  Back to All Folders
                </Button>
              )}
              <Heading size="lg" color="gray.800">
                Documents Management
              </Heading>
            </HStack>
            <Text color={textColor}>
              {currentFolder 
                ? `Documents in ${folders.find(f => f.id === currentFolder)?.name}`
                : 'Manage documents and files for ACPN Ota Zone'
              }
            </Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={FiFolderPlus} />}
              variant="outline"
              onClick={handleCreateFolder}
              size="md"
              borderRadius="xl"
            >
              New Folder
            </Button>
            <Button
              leftIcon={<Icon as={FiFilePlus} />}
              colorScheme="brand"
              onClick={handleCreateDocument}
              size="md"
              borderRadius="xl"
            >
              Upload Document
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Documents</StatLabel>
                  <StatNumber>{stats.totalDocuments}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    15% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Storage Used</StatLabel>
                  <StatNumber>{formatFileSize(stats.totalSize)}</StatNumber>
                  <StatHelpText>75% of quota</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Public Documents</StatLabel>
                  <StatNumber color="green.500">{stats.publicDocuments}</StatNumber>
                  <StatHelpText>
                    {Math.round((stats.publicDocuments / stats.totalDocuments) * 100)}% of total
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Downloads</StatLabel>
                  <StatNumber>{stats.totalDownloads}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    28% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Main Content */}
        <Card bg={cardBg} shadow="sm" borderRadius="xl">
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>All Documents</Tab>
                <Tab>Folders</Tab>
                <Tab>Recent Activity</Tab>
                <Tab>Storage Analytics</Tab>
              </TabList>

              <TabPanels>
                {/* All Documents Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Filters and Search */}
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                      <HStack spacing={4} flex={1}>
                        <InputGroup maxW="300px">
                          <InputLeftElement>
                            <Icon as={FiSearch} color={textColor} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderRadius="xl"
                          />
                        </InputGroup>
                        
                        <Select
                          placeholder="All Categories"
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          maxW="150px"
                          borderRadius="xl"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Select>

                        <Select
                          placeholder="All Types"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          maxW="120px"
                          borderRadius="xl"
                        >
                          {documentTypes.map(type => (
                            <option key={type} value={type}>
                              {type.toUpperCase()}
                            </option>
                          ))}
                        </Select>
                      </HStack>

                      <HStack>
                        <IconButton
                          icon={<Icon as={FiFilter} />}
                          aria-label="Advanced filters"
                          variant="outline"
                          borderRadius="xl"
                        />
                        <IconButton
                          icon={<Icon as={FiDownload} />}
                          aria-label="Export list"
                          variant="outline"
                          borderRadius="xl"
                        />
                      </HStack>
                    </Flex>

                    {/* Documents Grid */}
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {filteredDocuments.map((document) => (
                        <DocumentCard key={document.id} document={document} />
                      ))}
                    </Grid>

                    {filteredDocuments.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Icon as={FiFileText} boxSize={12} color={textColor} mb={4} />
                        <Heading size="md" color={textColor} mb={2}>
                          No documents found
                        </Heading>
                        <Text color={textColor}>
                          {searchTerm || filterCategory !== 'all' || filterType !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Upload your first document to get started'
                          }
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Folders Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="between" align="center">
                      <Heading size="md">Document Folders</Heading>
                      <Button 
                        size="sm" 
                        leftIcon={<Icon as={FiFolderPlus} />}
                        variant="outline" 
                        borderRadius="xl"
                        onClick={handleCreateFolder}
                      >
                        New Folder
                      </Button>
                    </Flex>
                    
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {folders.map((folder) => (
                        <FolderCard key={folder.id} folder={folder} />
                      ))}
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Recent Activity Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Recent Document Activity</Heading>
                    
                    <VStack spacing={4} align="stretch">
                      {documents
                        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                        .slice(0, 10)
                        .map(document => (
                          <Card key={document.id} bg={cardBg} shadow="sm">
                            <CardBody>
                              <HStack justify="space-between">
                                <HStack spacing={3}>
                                  <Icon 
                                    as={getFileIcon(document.type)} 
                                    color={`${getTypeColor(document.type)}.500`}
                                  />
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {document.name}
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                      Modified by {document.uploadedBy} on {new Date(document.lastModified).toLocaleDateString()}
                                    </Text>
                                  </VStack>
                                </HStack>
                                <HStack>
                                  <Badge colorScheme={getTypeColor(document.type)} size="sm">
                                    {document.type.toUpperCase()}
                                  </Badge>
                                  <IconButton
                                    icon={<Icon as={FiEye} />}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="View document"
                                  />
                                </HStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))
                      }
                    </VStack>
                  </VStack>
                </TabPanel>

                {/* Storage Analytics Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Storage & Usage Analytics</Heading>
                    
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                      <GridItem>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Storage Usage by Type</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              {documentTypes
                                .filter(type => documents.some(d => d.type === type))
                                .map(type => {
                                  const typeDocuments = documents.filter(d => d.type === type);
                                  const typeSize = typeDocuments.reduce((sum, doc) => sum + doc.size, 0);
                                  const percentage = (typeSize / stats.totalSize) * 100;
                                  
                                  return (
                                    <Box key={type}>
                                      <Flex justify="space-between" mb={1}>
                                        <HStack>
                                          <Badge colorScheme={getTypeColor(type)} size="sm">
                                            {type.toUpperCase()}
                                          </Badge>
                                          <Text fontSize="sm">{typeDocuments.length} files</Text>
                                        </HStack>
                                        <Text fontSize="sm" fontWeight="medium">
                                          {formatFileSize(typeSize)}
                                        </Text>
                                      </Flex>
                                      <Progress
                                        value={percentage}
                                        colorScheme={getTypeColor(type)}
                                        borderRadius="full"
                                        size="sm"
                                      />
                                    </Box>
                                  );
                                })
                              }
                            </VStack>
                          </CardBody>
                        </Card>
                      </GridItem>
                      
                      <GridItem>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Most Downloaded</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              {documents
                                .sort((a, b) => b.downloadCount - a.downloadCount)
                                .slice(0, 5)
                                .map((document, index) => (
                                  <HStack key={document.id} justify="space-between">
                                    <HStack>
                                      <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                        #{index + 1}
                                      </Text>
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                          {document.name}
                                        </Text>
                                        <Text fontSize="xs" color={textColor}>
                                          {document.type.toUpperCase()}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    <Badge colorScheme="green" size="sm">
                                      {document.downloadCount}
                                    </Badge>
                                  </HStack>
                                ))
                              }
                            </VStack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Upload/Edit Document Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            {isEditing ? 'Edit Document' : 'Upload New Document'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Document Name</FormLabel>
                <Input
                  placeholder="Enter document name"
                  borderRadius="xl"
                  defaultValue={selectedDocument?.name}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter document description"
                  borderRadius="xl"
                  defaultValue={selectedDocument?.description}
                />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    borderRadius="xl"
                    defaultValue={selectedDocument?.category}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Folder</FormLabel>
                  <Select borderRadius="xl" defaultValue={selectedDocument?.folderId}>
                    <option value="">No Folder</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              {!isEditing && (
                <FormControl isRequired>
                  <FormLabel>File</FormLabel>
                  <Box
                    border="2px dashed"
                    borderColor={borderColor}
                    borderRadius="xl"
                    p={6}
                    textAlign="center"
                    cursor="pointer"
                    _hover={{ borderColor: 'brand.500' }}
                  >
                    <Icon as={FiUpload} boxSize={8} color={textColor} mb={2} />
                    <Text color={textColor}>
                      Click to upload or drag and drop files here
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      PDF, DOC, XLS, PPT, Images up to 50MB
                    </Text>
                  </Box>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Input
                  placeholder="Enter tags separated by commas"
                  borderRadius="xl"
                  defaultValue={selectedDocument?.tags.join(', ')}
                />
              </FormControl>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  {isEditing ? 'Update Document' : 'Upload Document'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Create Folder Modal */}
      <Modal isOpen={isFolderOpen} onClose={onFolderClose}>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Create New Folder</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Folder Name</FormLabel>
                <Input
                  placeholder="Enter folder name"
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter folder description"
                  borderRadius="xl"
                />
              </FormControl>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onFolderClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  Create Folder
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ModernDocumentsManagement;
