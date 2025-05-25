import React, { useState } from 'react';
import { FaCheck, FaBell, FaUser, FaCog, FaChartBar } from 'react-icons/fa';

// Import all Shadcn UI components
import {
  Alert,
  AlertTitle,
  AlertDescription,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  Checkbox,
  Dialog,
  FormGroup,
  FormLabel,
  FormDescription,
  FormError,
  Input,
  NavBar,
  NavMenu,
  NavItem,
  NavLink,
  Pagination,
  Progress,
  RadioGroup,
  Select,
  Skeleton,
  SkeletonText,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  Tooltip,
  SimpleTooltip,
} from '../../components/shadcn';

const ComponentPreview: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('buttons');

  // Example data
  const radioOptions = [
    {
      id: 'radio-1',
      value: 'option1',
      label: 'Option 1',
      description: 'This is option 1',
    },
    {
      id: 'radio-2',
      value: 'option2',
      label: 'Option 2',
      description: 'This is option 2',
    },
    {
      id: 'radio-3',
      value: 'option3',
      label: 'Option 3',
      description: 'This is option 3',
    },
  ];

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'Inactive',
    },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shadcn UI Component Preview</h1>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="mb-10"
      >
        <TabsList>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Form Elements</TabsTrigger>
          <TabsTrigger value="data">Data Display</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                Button components with different variants and states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Button Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button>Default Button</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Button Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Button States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button disabled>Disabled</Button>
                    <Button isLoading>Loading</Button>
                    <Button>
                      <FaCheck className="mr-2" />
                      With Icon
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>
                  A simple card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  This is the content of the card. You can put any elements
                  here.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
                <CardDescription>
                  A card with actions in the footer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the use of a footer for actions.</p>
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
              </CardFooter>
            </Card>

            <StatCard
              title="Total Users"
              value={1254}
              icon={<FaUser className="h-5 w-5" />}
              trend={{
                value: '+12%',
                direction: 'up',
                label: 'since last month',
              }}
            />

            <StatCard
              title="Revenue"
              value="$12,543"
              variant="success"
              icon={<FaChartBar className="h-5 w-5" />}
              trend={{
                value: '+8.2%',
                direction: 'up',
                label: 'compared to last week',
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="forms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>
                Various form inputs and controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup>
                  <FormLabel required>Name</FormLabel>
                  <Input placeholder="Enter your name" />
                  <FormDescription>
                    Your full name as it appears on your ID.
                  </FormDescription>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" placeholder="Enter your email" />
                  <FormError>Please enter a valid email address</FormError>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Country</FormLabel>
                  <Select
                    options={selectOptions}
                    placeholder="Select a country"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Subscription</FormLabel>
                  <RadioGroup name="subscription" options={radioOptions} />
                </FormGroup>
              </div>

              <FormGroup>
                <FormLabel>Message</FormLabel>
                <Textarea placeholder="Enter your message" rows={4} />
              </FormGroup>

              <FormGroup>
                <Checkbox
                  label="I agree to the terms and conditions"
                  description="By checking this box, you agree to our Terms of Service and Privacy Policy."
                />
              </FormGroup>
            </CardContent>
            <CardFooter>
              <Button>Submit</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <div className="space-y-10">
            <Card>
              <CardHeader>
                <CardTitle>Table</CardTitle>
                <CardDescription>Display tabular data</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row) => (
                      <TableRow key={row.id} isClickable>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === 'Active'
                                ? 'success'
                                : row.status === 'Inactive'
                                ? 'outline'
                                : 'default'
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Status indicators and labels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Badge>Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avatars</CardTitle>
                <CardDescription>User profile pictures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-center">
                  <Avatar src="https://github.com/shadcn.png" alt="User" />
                  <Avatar
                    src="https://github.com/ghost.png"
                    alt="User with fallback"
                    fallback="JD"
                  />
                  <Avatar fallback="AB" />
                  <Avatar size="sm" fallback="SM" />
                  <Avatar size="lg" fallback="LG" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Display progress indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Progress value={25} max={100} />
                <Progress value={50} max={100} showValue />
                <Progress
                  value={75}
                  max={100}
                  size="lg"
                  variant="success"
                  showValue
                />
                <Progress
                  value={90}
                  max={100}
                  variant="error"
                  striped
                  animated
                  showValue
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <div className="space-y-10">
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Display important messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>Default Alert</AlertTitle>
                  <AlertDescription>
                    This is a default information alert.
                  </AlertDescription>
                </Alert>

                <Alert variant="success">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your action was completed successfully!
                  </AlertDescription>
                </Alert>

                <Alert variant="warning">
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Please review your information before proceeding.
                  </AlertDescription>
                </Alert>

                <Alert variant="error">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem with your request.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tooltips</CardTitle>
                <CardDescription>
                  Display additional information on hover
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 items-center">
                  <Tooltip content="This is a tooltip">
                    <Button variant="outline">Hover Me</Button>
                  </Tooltip>

                  <SimpleTooltip tip="Edit settings">
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                      <FaCog className="h-5 w-5" />
                    </button>
                  </SimpleTooltip>

                  <SimpleTooltip tip="This is a left tooltip" placement="left">
                    <span className="underline cursor-help">Left Tooltip</span>
                  </SimpleTooltip>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dialogs</CardTitle>
                <CardDescription>
                  Modal dialogs for focused interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsDialogOpen(true)}>
                  Open Dialog
                </Button>

                <Dialog
                  isOpen={isDialogOpen}
                  onClose={() => setIsDialogOpen(false)}
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">Dialog Title</h2>
                    <p className="mb-4">
                      This is a dialog modal that can be used for focused
                      interactions.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => setIsDialogOpen(false)}>
                        Confirm
                      </Button>
                    </div>
                  </div>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeletons</CardTitle>
                <CardDescription>Loading state placeholders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton height={24} width={200} />
                    <SkeletonText lines={3} />
                  </div>

                  <div className="flex space-x-4 items-center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="space-y-2 flex-1">
                      <Skeleton height={20} width="60%" />
                      <Skeleton height={16} width="80%" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="navigation" className="mt-6">
          <div className="space-y-10">
            <Card>
              <CardHeader>
                <CardTitle>Pagination</CardTitle>
                <CardDescription>
                  Navigate through paginated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Pagination
                  totalPages={10}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation Components</CardTitle>
                <CardDescription>UI components for navigation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">NavBar</h3>
                  <div className="border rounded-md overflow-hidden">
                    <NavBar
                      logo={<div className="font-bold text-xl">Logo</div>}
                    >
                      <NavMenu>
                        <NavItem>
                          <NavLink href="#" active>
                            Home
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink href="#">Features</NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink href="#">Pricing</NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink href="#">About</NavLink>
                        </NavItem>
                      </NavMenu>
                      <div className="ml-auto">
                        <Button size="sm">Sign Up</Button>
                      </div>
                    </NavBar>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    NavMenu (Vertical)
                  </h3>
                  <div className="w-64 border rounded-md p-2">
                    <NavMenu orientation="vertical">
                      <NavItem>
                        <NavLink href="#" active>
                          Dashboard
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink href="#">Profile</NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink href="#">Settings</NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink href="#">Logout</NavLink>
                      </NavItem>
                    </NavMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComponentPreview;
