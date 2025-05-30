import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ui/ThemeToggle';

const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-10 rounded-lg shadow-md text-center">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div>
          <svg
            className="mx-auto h-16 w-16 text-destructive"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            You don't have permission to access this page
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-foreground">
            Your current role:
            <span className="ml-2 px-3 py-1 rounded-full text-sm font-medium bg-accent text-foreground capitalize">
              {user?.role || 'Unknown'}
            </span>
          </p>

          <div className="mt-6">
            <Link
              to="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to Dashboard
            </Link>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">
              If you believe this is an error, please contact the system
              administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
