import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ui/ThemeToggle';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isSubmittingCode, setIsSubmittingCode] = useState<boolean>(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Verify using token (from URL)
  useEffect(() => {
    const verifyEmailWithToken = async () => {
      if (token) {
        try {
          const _response = await authService.verifyEmail(token);
          setVerificationStatus('success');

          // Redirect to login page after successful verification
          setTimeout(() => {
            navigate('/login', {
              state: {
                message:
                  'Email verified successfully. Please wait for admin approval before logging in.',
              },
            });
          }, 5000);
        } catch (error: any) {
          setVerificationStatus('error');
          setErrorMessage(
            error.response?.data?.message ||
              'Verification failed. Please try using the verification code instead.'
          );
        }
      }
    };

    if (token) {
      verifyEmailWithToken();
    }
  }, [token, navigate]);

  // Verify using code
  const handleVerifyWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCode(true);

    try {
      await authService.verifyEmailWithCode(email, verificationCode);
      setVerificationStatus('success');

      // Redirect to login page after successful verification
      setTimeout(() => {
        navigate('/login', {
          state: {
            message:
              'Email verified successfully. Please wait for admin approval before logging in.',
          },
        });
      }, 5000);
    } catch (error: any) {
      setVerificationStatus('error');
      setErrorMessage(
        error.response?.data?.message ||
          'Code verification failed. Please check your email and code.'
      );
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Render appropriate UI based on status
  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        if (token) {
          return (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-lg text-foreground">
                Verifying your email...
              </p>
            </div>
          );
        } else {
          return renderCodeVerificationForm();
        }

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-foreground">
              Email Verified!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your email has been successfully verified. You will be redirected
              to the login page.
              <br />
              Please note that an administrator needs to approve your account
              before you can log in.
            </p>
            <div className="mt-4">
              <Link
                to="/login"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Go to login page →
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/15">
              <svg
                className="h-6 w-6 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-foreground">
              Verification Failed
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>

            {renderCodeVerificationForm()}
          </div>
        );
    }
  };

  // Render verification code form
  const renderCodeVerificationForm = () => {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-foreground">
          Verify with Code
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit verification code sent to your email address.
        </p>
        <form onSubmit={handleVerifyWithCode} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-border bg-background text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-primary"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-foreground"
            >
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="mt-1 block w-full rounded-md border-border bg-background text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-primary"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmittingCode}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmittingCode ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
