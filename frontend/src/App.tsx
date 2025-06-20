import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ModernNotificationProvider } from './components/notifications/ModernNotificationSystem';
import { ToastProvider } from './components/shadcn/toast';
import { ReactQueryProvider } from './lib/react-query';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedDashboard from './components/dashboard/RoleBasedDashboard';

// Modern Dashboard Components
import AdminDashboard from './components/dashboard/AdminDashboard';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ModernRegister from './pages/auth/ModernRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Unauthorized from './pages/auth/Unauthorized';
import NotFound from './pages/auth/NotFound';

// Dashboard Pages
import MemberDashboard from './pages/dashboard/MemberDashboard';
import ModernProfile from './pages/dashboard/ModernProfile';

// Admin Pages
import AdminDuesManagement from './pages/admin/AdminDuesManagement';
import UsersManagement from './pages/admin/UsersManagement';
import RolesManagement from './pages/admin/RolesManagement';
import PermissionsManagement from './pages/admin/PermissionsManagement';
import PharmaciesManagement from './pages/admin/PharmaciesManagement';
import EventManagement from './pages/admin/EventManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import ModernElectionsManagement from './pages/admin/ModernElectionsManagement';
import ModernCommunicationsManagement from './pages/admin/ModernCommunicationsManagement';
import ModernPollsManagement from './pages/admin/ModernPollsManagement';
import ModernDocumentsManagement from './pages/admin/ModernDocumentsManagement';
import ModernFinancesDashboard from './pages/admin/ModernFinancesDashboard';
import ModernNotificationsManagement from './pages/admin/ModernNotificationsManagement';
import AdminSettings from './pages/admin/AdminSettings';

// Financial Management Pages
import TransactionList from './pages/dashboard/TransactionList';
import TransactionForm from './pages/dashboard/TransactionForm';
import TransactionDetail from './pages/dashboard/TransactionDetail';
import DuesManagement from './pages/dashboard/DuesManagement';
import DonationsManagement from './pages/dashboard/DonationsManagement';
import DonationFormComponent from './pages/dashboard/DonationFormComponent';
import FinancialReports from './pages/dashboard/FinancialReports';
import FinancialManagement from './pages/dashboard/FinancialManagement';
import AdminPaymentReview from './pages/dashboard/AdminPaymentReview';
import PaymentHistoryReactQuery from './pages/dashboard/PaymentHistory-react-query';
import FinancialAnalytics from './pages/dashboard/FinancialAnalytics';
import ClearanceCertificateGeneration from './pages/dashboard/ClearanceCertificateGeneration';
import CertificateHistory from './pages/dashboard/CertificateHistory';
import CollectionReports from './pages/dashboard/CollectionReports';
import OutstandingDues from './pages/dashboard/OutstandingDues';
// Import the React Query version of DuesManagement
import DueManagementReactQuery from './pages/dashboard/DueManagement-react-query';

// Modernized Chakra UI Financial Management Pages
import DueTypesManagementChakra from './pages/dashboard/DueTypesManagementChakra';
import DueAssignmentChakra from './pages/dashboard/DueAssignmentChakra';
import BulkDueAssignmentChakra from './pages/dashboard/BulkDueAssignmentChakra';
import PenaltyManagementChakra from './pages/dashboard/PenaltyManagementChakra';
import PaymentReportsChakra from './pages/dashboard/PaymentReportsChakra';

// Event Management Pages (Old - keeping for backward compatibility)
import EventDashboard from './pages/dashboard/EventDashboard';
import EventList from './pages/dashboard/EventList';
import EventForm from './pages/dashboard/EventForm';
import EventDetail from './pages/dashboard/EventDetail';
import EventCalendar from './pages/dashboard/EventCalendar';
import EventReports from './pages/dashboard/EventReports';
import EventCheckIn from './pages/dashboard/EventCheckIn';
import AttendeeManagement from './pages/dashboard/AttendeeManagement';

// New Event Management Pages
import AdminEventsList from './pages/admin/AdminEventsList';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminAttendanceMarking from './pages/admin/AdminAttendanceMarking';
import DashboardAttendanceManagement from './pages/dashboard/AttendanceManagement';
import MemberEventsList from './pages/member/MemberEventsList';
import MemberEventDetails from './pages/member/MemberEventDetails';
import MemberEventRegistration from './pages/member/MemberEventRegistration';
import MemberAttendanceStatus from './pages/dashboard/MemberAttendanceStatus';

// Communication Pages
import CommunicationsDashboard from './pages/dashboard/CommunicationsDashboard';
import CommunicationsList from './pages/dashboard/CommunicationsList';
import CommunicationForm from './pages/dashboard/CommunicationForm';
import CommunicationDetail from './pages/dashboard/CommunicationDetail';
import MessagingInterface from './pages/dashboard/MessagingInterface';
import AnnouncementsInterface from './pages/dashboard/AnnouncementsInterface';
import NotificationsPage from './pages/dashboard/NotificationsPage';

// Election Pages
import ElectionDashboard from './pages/dashboard/ElectionDashboard';
import ElectionsList from './pages/dashboard/ElectionsList';
import ElectionForm from './pages/dashboard/ElectionForm';
import ElectionDetail from './pages/dashboard/ElectionDetail';
import VotingInterface from './pages/dashboard/VotingInterface';
import ElectionResults from './pages/dashboard/ElectionResults';
import CandidateForm from './pages/dashboard/CandidateForm';

// Poll Pages
import PollDashboard from './pages/dashboard/PollDashboard';
import PollsList from './pages/dashboard/PollsList';
import PollForm from './pages/dashboard/PollForm';
import PollDetail from './pages/dashboard/PollDetail';
import PollResponse from './pages/dashboard/PollResponse';

// Document Management Pages
import DocumentDashboard from './pages/dashboard/DocumentDashboard';
import DocumentsList from './pages/dashboard/DocumentsList';
import DocumentForm from './pages/dashboard/DocumentForm';
import DocumentDetail from './pages/dashboard/DocumentDetail';
import VersionUploadForm from './pages/dashboard/VersionUploadForm';

// Pharmacy Management Pages
import PharmacyProfile from './pages/dashboard/PharmacyProfile';
import PharmacyForm from './pages/dashboard/PharmacyForm';
import PharmacyDues from './pages/dashboard/PharmacyDues';

// Test Components
// import TestApiConnection from './components/TestApiConnection';

// Public Pages
import LandingPage from './pages/LandingPage';
import DueForm from './pages/dashboard/DueForm';
import RecordPaymentForm from './pages/dashboard/RecordPaymentForm';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ModernNotificationProvider>
              <ReactQueryProvider>
                <Router>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/landing" element={<LandingPage />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<ModernRegister />} />
                    <Route path="/register-old" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                  />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route
                    path="/verify-email/:token"
                    element={<VerifyEmail />}
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Redirect root to landing */}
                  <Route
                    path="/"
                    element={<Navigate to="/landing" replace />}
                  />

                  {/* Protected Dashboard Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route
                        path="/dashboard"
                        element={<RoleBasedDashboard />}
                      />
                      <Route
                        path="/member-dashboard"
                        element={<MemberDashboard />}
                      />
                      <Route path="/profile" element={<ModernProfile />} />

                      {/* Admin Routes - Add more protected routes as needed */}
                      <Route
                        element={
                          <ProtectedRoute
                            allowedRoles={['admin', 'superadmin']}
                          />
                        }
                      >                        <Route
                          path="/admin/dashboard"
                          element={<AdminDashboard />}
                        />                        <Route path="/users" element={<UsersManagement />} />
                        <Route
                          path="/admin/users"
                          element={<UsersManagement />}
                        />
                        <Route
                          path="/admin/users/:id"
                          element={<UsersManagement />}
                        />
                        <Route
                          path="/admin/users/:id/edit"
                          element={<UsersManagement />}
                        />
                        <Route
                          path="/admin/roles"
                          element={<RolesManagement />}
                        />
                        <Route
                          path="/admin/permissions"
                          element={<PermissionsManagement />}
                        />
                        <Route
                          path="/pharmacies"
                          element={<PharmaciesManagement />}
                        />
                        <Route
                          path="/admin/pharmacies"
                          element={<PharmaciesManagement />}
                        />
                        <Route
                          path="/admin/pharmacies/:id"
                          element={<PharmaciesManagement />}
                        />                        <Route path="/settings" element={<AdminSettings />} />
                        <Route
                          path="/admin/dues-management"
                          element={<AdminDuesManagement />}
                        />
                        <Route
                          path="/admin/events"
                          element={<EventManagement />}
                        />                        <Route
                          path="/admin/attendance-management"
                          element={<AttendanceManagement />}
                        />
                        <Route
                          path="/elections"
                          element={<ModernElectionsManagement />}
                        />                        <Route
                          path="/communications"
                          element={<ModernCommunicationsManagement />}
                        />
                        <Route
                          path="/polls"
                          element={<ModernPollsManagement />}
                        />
                        <Route
                          path="/documents"
                          element={<ModernDocumentsManagement />}
                        />
                        <Route
                          path="/notifications"
                          element={<ModernNotificationsManagement />}
                        />
                        <Route
                          path="/finances"
                          element={<ModernFinancesDashboard />}
                        />
                      </Route>

                      {/* Treasurer Routes */}
                      <Route
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              'admin',
                              'superadmin',
                              'treasurer',
                              'financial_secretary',
                            ]}
                          />
                        }
                      >                        <Route
                          path="/finances"
                          element={<ModernFinancesDashboard />}
                        />
                        <Route
                          path="/dashboard/financial-management"
                          element={<FinancialManagement />}
                        />                        <Route
                          path="/dashboard/assign-dues"
                          element={<DueAssignmentChakra />}
                        />
                        <Route
                          path="/finances/dues"
                          element={<DuesManagement />}
                        />
                        <Route
                          path="/finances/dues/new"
                          element={<DueForm />}
                        />                        <Route
                          path="/dashboard/manage-penalties"
                          element={<PenaltyManagementChakra />}
                        />                        <Route
                          path="/dashboard/due-types"
                          element={<DueTypesManagementChakra />}
                        />                        <Route
                          path="/dashboard/bulk-assign-dues"
                          element={<BulkDueAssignmentChakra />}
                        />
                        <Route
                          path="/dashboard/payment-history"
                          element={<PaymentHistoryReactQuery />}
                        />
                        <Route
                          path="/dashboard/financial-analytics"
                          element={<FinancialAnalytics />}
                        />                        <Route
                          path="/dashboard/generate-certificates"
                          element={<ClearanceCertificateGeneration />}
                        />
                        <Route
                          path="/dashboard/certificate-history"
                          element={<CertificateHistory />}
                        />                        <Route
                          path="/dashboard/payment-reports"
                          element={<PaymentReportsChakra />}
                        />
                        <Route
                          path="/dashboard/collection-reports"
                          element={<CollectionReports />}
                        />
                        <Route
                          path="/dashboard/outstanding-dues"
                          element={<OutstandingDues />}
                        />
                        <Route
                          path="/dashboard/admin-payment-review"
                          element={<AdminPaymentReview />}
                        />
                        <Route
                          path="/finances/transactions"
                          element={<TransactionList />}
                        />
                        <Route
                          path="/finances/transactions/new"
                          element={<TransactionForm />}
                        />
                        <Route
                          path="/finances/transactions/:id"
                          element={<TransactionDetail />}
                        />
                        <Route
                          path="/finances/transactions/:id/edit"
                          element={<TransactionForm />}
                        />
                        <Route
                          path="/finances/dues"
                          element={<DueManagementReactQuery />}
                        />
                        <Route
                          path="/finances/dues/new"
                          element={<DueForm />}
                        />
                        <Route
                          path="/finances/donations"
                          element={<DonationsManagement />}
                        />
                        <Route
                          path="/finances/donations/new"
                          element={<DonationFormComponent />}
                        />
                        <Route
                          path="/finances/donations/:id"
                          element={<DonationFormComponent />}
                        />
                        <Route
                          path="/finances/donations/:id/edit"
                          element={<DonationFormComponent />}
                        />
                        <Route
                          path="/finances/reports"
                          element={<FinancialReports />}
                        />
                        <Route
                          path="/donations"
                          element={
                            <div>Donations Management (Coming Soon)</div>
                          }
                        />                        <Route
                          path="/finances/bulk-due-assignment"
                          element={<BulkDueAssignmentChakra />}
                        />
                        <Route
                          path="/finances/payment-history"
                          element={<PaymentHistoryReactQuery />}
                        />
                        <Route
                          path="/finances/financial-analytics"
                          element={<FinancialAnalytics />}
                        />
                        <Route
                          path="/finances/generate-clearance-certificate"
                          element={<ClearanceCertificateGeneration />}
                        />                        <Route
                          path="/finances/payment-reports"
                          element={<PaymentReportsChakra />}
                        />
                        <Route
                          path="/finances/collection-reports"
                          element={<CollectionReports />}
                        />
                        <Route
                          path="/finances/outstanding-dues"
                          element={<OutstandingDues />}
                        />
                        <Route
                          path="/finances/payments/new"
                          element={<RecordPaymentForm />}
                        />
                      </Route>

                      {/* Secretary/Admin Routes */}
                      <Route
                        element={
                          <ProtectedRoute
                            allowedRoles={['admin', 'superadmin', 'secretary']}
                          />
                        }
                      >
                        {/* New Event Management System */}
                        <Route
                          path="/admin/events"
                          element={<AdminEventsList />}
                        />
                        <Route
                          path="/admin/events/create"
                          element={<AdminEventForm />}
                        />
                        <Route
                          path="/admin/events/:id"
                          element={<AdminEventDetail />}
                        />
                        <Route
                          path="/admin/events/:id/edit"
                          element={<AdminEventForm />}
                        />
                        <Route
                          path="/admin/events/:id/attendance"
                          element={<AdminAttendanceMarking />}
                        />                        {/* Attendance Management Routes */}
                        <Route
                          path="/dashboard/attendance-management"
                          element={<DashboardAttendanceManagement />}
                        />

                        {/* Legacy event routes (keeping for backward compatibility) */}
                        <Route path="/events" element={<EventList />} />
                        <Route
                          path="/events/dashboard"
                          element={<EventDashboard />}
                        />
                        <Route
                          path="/events/calendar"
                          element={<EventCalendar />}
                        />
                        <Route path="/events/create" element={<EventForm />} />
                        <Route
                          path="/events/report"
                          element={<EventReports />}
                        />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route
                          path="/events/:id/edit"
                          element={<EventForm />}
                        />
                        <Route
                          path="/events/:id/register"
                          element={<AttendeeManagement />}
                        />
                        <Route
                          path="/events/:id/check-in"
                          element={<EventCheckIn />}
                        />
                        <Route
                          path="/events/:id/attendees/:attendeeId"
                          element={<AttendeeManagement />}
                        />
                        <Route
                          path="/communications/dashboard"
                          element={<CommunicationsDashboard />}
                        />
                        <Route
                          path="/communications"
                          element={
                            <Navigate to="/communications/dashboard" replace />
                          }
                        />
                        <Route
                          path="/communications/list"
                          element={<CommunicationsList />}
                        />
                        <Route
                          path="/communications/compose"
                          element={<CommunicationForm />}
                        />
                        <Route
                          path="/communications/:id"
                          element={<CommunicationDetail />}
                        />
                        <Route
                          path="/communications/:id/edit"
                          element={<CommunicationForm />}
                        />
                        <Route
                          path="/communications/messages"
                          element={<MessagingInterface />}
                        />
                        <Route
                          path="/communications/announcements"
                          element={<AnnouncementsInterface />}
                        />
                        <Route
                          path="/documents/dashboard"
                          element={<DocumentDashboard />}
                        />
                        <Route
                          path="/documents"
                          element={
                            <Navigate to="/documents/dashboard" replace />
                          }
                        />
                        <Route
                          path="/documents/list"
                          element={<DocumentsList />}
                        />
                        <Route
                          path="/documents/upload"
                          element={<DocumentForm />}
                        />
                        <Route
                          path="/documents/:id"
                          element={<DocumentDetail />}
                        />
                        <Route
                          path="/documents/:id/upload-version"
                          element={<VersionUploadForm />}
                        />
                      </Route>

                      {/* Member Routes */}
                      <Route
                        path="/my-pharmacy"
                        element={<PharmacyProfile />}
                      />
                      <Route
                        path="/my-pharmacy/create"
                        element={<PharmacyForm />}
                      />
                      <Route
                        path="/my-pharmacy/edit"
                        element={<PharmacyForm />}
                      />
                      <Route path="/payments" element={<PharmacyDues />} />
                      <Route path="/my-documents" element={<DocumentsList />} />

                      {/* Member Attendance Route */}
                      <Route
                        path="/dashboard/attendance-status"
                        element={<MemberAttendanceStatus />}
                      />

                      {/* Member Event Routes */}
                      <Route
                        path="/member/events"
                        element={<MemberEventsList />}
                      />
                      <Route
                        path="/member/events/:eventId"
                        element={<MemberEventDetails />}
                      />
                      <Route
                        path="/member/events/:id/register"
                        element={<MemberEventRegistration />}
                      />

                      <Route
                        path="/messages"
                        element={<MessagingInterface />}
                      />
                      <Route
                        path="/notifications"
                        element={<NotificationsPage />}
                      />
                      <Route
                        path="/elections/dashboard"
                        element={<ElectionDashboard />}
                      />
                      <Route
                        path="/elections"
                        element={<Navigate to="/elections/dashboard" replace />}
                      />
                      <Route
                        path="/elections/list"
                        element={<ElectionsList />}
                      />
                      <Route
                        path="/elections/create"
                        element={<ElectionForm />}
                      />
                      <Route
                        path="/elections/:id"
                        element={<ElectionDetail />}
                      />
                      <Route
                        path="/elections/:id/edit"
                        element={<ElectionForm />}
                      />
                      <Route
                        path="/elections/:id/vote"
                        element={<VotingInterface />}
                      />
                      <Route
                        path="/elections/:id/results"
                        element={<ElectionResults />}
                      />
                      <Route
                        path="/elections/:electionId/positions/:positionId/candidates/add"
                        element={<CandidateForm />}
                      />
                      <Route
                        path="/elections/:electionId/positions/:positionId/candidates/:candidateId/edit"
                        element={<CandidateForm />}
                      />

                      <Route
                        path="/polls/dashboard"
                        element={<PollDashboard />}
                      />
                      <Route
                        path="/polls"
                        element={<Navigate to="/polls/dashboard" replace />}
                      />
                      <Route path="/polls/list" element={<PollsList />} />
                      <Route path="/polls/create" element={<PollForm />} />
                      <Route path="/polls/:id" element={<PollDetail />} />
                      <Route path="/polls/:id/edit" element={<PollForm />} />
                      <Route
                        path="/polls/:id/respond"
                        element={<PollResponse />}
                      />

                      {/* API Connection Test */}
                      {/* <Route path="/test-api" element={<TestApiConnection />} /> */}
                    </Route>
                  </Route>

                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />                </Routes>
              </Router>
            </ReactQueryProvider>
            </ModernNotificationProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
