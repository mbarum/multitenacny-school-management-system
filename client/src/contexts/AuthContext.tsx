import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import storage from '../services/storage';
import { UserRole } from '../../../src/common/user-role.enum';

interface User {
  username: string;
  email?: string;
  role: UserRole;
  tenantId?: string;
  plan?: string;
  subscriptionStatus?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = storage.getItem('token');
    if (token) {
      try {
        const decoded: { 
          username: string; 
          email: string;
          role: UserRole; 
          tenantId: string;
          plan: string;
          subscriptionStatus: string;
        } = jwtDecode(token);
        
        setUser({ 
          username: decoded.username, 
          email: decoded.email,
          role: decoded.role,
          tenantId: decoded.tenantId,
          plan: decoded.plan,
          subscriptionStatus: decoded.subscriptionStatus
        });
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to decode token', e);
        storage.removeItem('token');
      }
    }
  }, []);

  const login = (token: string) => {
    storage.setItem('token', token);
    const decoded: { 
      username: string; 
      email: string;
      role: UserRole; 
      tenantId: string;
      plan: string;
      subscriptionStatus: string;
    } = jwtDecode(token);

    setUser({ 
      username: decoded.username, 
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      plan: decoded.plan,
      subscriptionStatus: decoded.subscriptionStatus
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    storage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
