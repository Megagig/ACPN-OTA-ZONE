import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/auth/Unauthorized';
import NotFound from './pages/auth/NotFound';

// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome';
import UserProfile from './pages/dashboard/UserProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Financial Management Pages
import FinancialDashboard from './pages/dashboard/FinancialDashboard';
import TransactionList from './pages/dashboard/TransactionList';
import TransactionForm from './pages/dashboard/TransactionForm';
import TransactionDetail from './pages/dashboard/TransactionDetail';
import DuesManagement from './pages/dashboard/DuesManagement';

// Event Management Pages
import EventDashboard from './pages/dashboard/EventDashboard';
import EventList from './pages/dashboard/EventList';
import EventForm from './pages/dashboard/EventForm';
import EventDetail from './pages/dashboard/EventDetail';
import EventCalendar from './pages/dashboard/EventCalendar';
import EventReports from './pages/dashboard/EventReports';
import EventCheckIn from './pages/dashboard/EventCheckIn';
import AttendeeManagement from './pages/dashboard/AttendeeManagement';

// Communication Pages
import CommunicationsDashboard from './pages/dashboard/CommunicationsDashboard';
import CommunicationsList from './pages/dashboard/CommunicationsList';
import CommunicationForm from './pages/dashboard/CommunicationForm';
import CommunicationDetail from './pages/dashboard/CommunicationDetail';
import MessagingInterface from './pages/dashboard/MessagingInterface';

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

// Public Pages
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Redirect root to landing */}
          <Route path="/" element={<Navigate to="/landing" replace />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/profile" element={<UserProfile />} />

              {/* Admin Routes - Add more protected routes as needed */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']} />
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route
                  path="/users"
                  element={<div>Users Management (Coming Soon)</div>}
                />
                <Route
                  path="/pharmacies"
                  element={<div>Pharmacies Management (Coming Soon)</div>}
                />
              </Route>

              {/* Treasurer Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['admin', 'superadmin', 'treasurer']}
                  />
                }
              >
                <Route path="/finances" element={<FinancialDashboard />} />
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
                <Route path="/finances/dues" element={<DuesManagement />} />
                <Route
                  path="/donations"
                  element={<div>Donations Management (Coming Soon)</div>}
                />
              </Route>

              {/* Secretary Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['admin', 'superadmin', 'secretary']}
                  />
                }
              >
                <Route path="/events" element={<EventList />} />
                <Route path="/events/dashboard" element={<EventDashboard />} />
                <Route path="/events/calendar" element={<EventCalendar />} />
                <Route path="/events/create" element={<EventForm />} />
                <Route path="/events/report" element={<EventReports />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/events/:id/edit" element={<EventForm />} />
                <Route
                  path="/events/:id/register"
                  element={<AttendeeManagement />}
                />
                <Route path="/events/:id/check-in" element={<EventCheckIn />} />
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
                  element={<Navigate to="/communications/dashboard" replace />}
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
                  path="/documents/dashboard"
                  element={<DocumentDashboard />}
                />
                <Route
                  path="/documents"
                  element={<Navigate to="/documents/dashboard" replace />}
                />
                <Route path="/documents/list" element={<DocumentsList />} />
                <Route path="/documents/upload" element={<DocumentForm />} />
                <Route path="/documents/:id" element={<DocumentDetail />} />
                <Route
                  path="/documents/:id/upload-version"
                  element={<VersionUploadForm />}
                />
              </Route>

              {/* Member Routes */}
              <Route path="/my-pharmacy" element={<PharmacyProfile />} />
              <Route path="/my-pharmacy/create" element={<PharmacyForm />} />
              <Route path="/my-pharmacy/edit" element={<PharmacyForm />} />
              <Route path="/payments" element={<PharmacyDues />} />
              <Route path="/my-documents" element={<DocumentsList />} />
              <Route
                path="/my-documents"
                element={<div>My Documents (Coming Soon)</div>}
              />
              <Route
                path="/payments"
                element={<div>Dues & Payments (Coming Soon)</div>}
              />
              <Route
                path="/messages"
                element={<div>Messages (Coming Soon)</div>}
              />
              <Route
                path="/elections/dashboard"
                element={<ElectionDashboard />}
              />
              <Route
                path="/elections"
                element={<Navigate to="/elections/dashboard" replace />}
              />
              <Route path="/elections/list" element={<ElectionsList />} />
              <Route path="/elections/create" element={<ElectionForm />} />
              <Route path="/elections/:id" element={<ElectionDetail />} />
              <Route path="/elections/:id/edit" element={<ElectionForm />} />
              <Route path="/elections/:id/vote" element={<VotingInterface />} />
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

              <Route path="/polls/dashboard" element={<PollDashboard />} />
              <Route
                path="/polls"
                element={<Navigate to="/polls/dashboard" replace />}
              />
              <Route path="/polls/list" element={<PollsList />} />
              <Route path="/polls/create" element={<PollForm />} />
              <Route path="/polls/:id" element={<PollDetail />} />
              <Route path="/polls/:id/edit" element={<PollForm />} />
              <Route path="/polls/:id/respond" element={<PollResponse />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
