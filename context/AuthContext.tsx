import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import { MOCK_AUTHOR } from '../constants';

interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent auth simulation
    const stored = localStorage.getItem('lumina_user');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async () => {
    // Simulate network latency for Google OAuth redirect/popup
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock Google Login Success
    const mockUser = MOCK_AUTHOR;
    setUser(mockUser);
    localStorage.setItem('lumina_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lumina_user');
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);