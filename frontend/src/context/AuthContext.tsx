import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import socketService from '../services/socket.service';
import type { LoginCredentials } from '../types/auth.types';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => void;
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Initialize socket connection
          const token = localStorage.getItem('token');
          if (token) {
            try {
              await socketService.connect(token);
              console.log('Socket connection established from AuthContext');
            } catch (socketError) {
              console.error('Failed to connect to socket:', socketError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);

      // Connect to socket after successful login
      if (response.token) {
        try {
          await socketService.connect(response.token);
          console.log('Socket connection established after login');
        } catch (socketError) {
          console.error(
            'Failed to connect to socket after login:',
            socketError
          );
        }
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Disconnect socket
    socketService.disconnect();

    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData: any) => {
    setUser({ ...user, ...userData });
    localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
