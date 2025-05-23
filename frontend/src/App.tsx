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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Redirect root to dashboard if logged in, otherwise to login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
                <Route
                  path="/finances"
                  element={<div>Financial Management (Coming Soon)</div>}
                />
                <Route
                  path="/dues"
                  element={<div>Dues Management (Coming Soon)</div>}
                />
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
                <Route
                  path="/events"
                  element={<div>Events Management (Coming Soon)</div>}
                />
                <Route
                  path="/communications"
                  element={<div>Communications (Coming Soon)</div>}
                />
                <Route
                  path="/documents"
                  element={<div>Documents (Coming Soon)</div>}
                />
              </Route>

              {/* Member Routes */}
              <Route
                path="/my-pharmacy"
                element={<div>My Pharmacy (Coming Soon)</div>}
              />
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
                path="/elections"
                element={<div>Elections (Coming Soon)</div>}
              />
              <Route path="/polls" element={<div>Polls (Coming Soon)</div>} />
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
