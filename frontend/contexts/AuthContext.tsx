import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import backend from '~backend/client';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useBackend() {
  const { user } = useAuth();
  if (!user) return backend;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return backend;
  
  return backend.with({
    auth: () => Promise.resolve({ authorization: `Bearer ${token}` })
  });
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const authenticatedBackend = backend.with({
        auth: () => Promise.resolve({ authorization: `Bearer ${token}` })
      });
      
      authenticatedBackend.auth.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await backend.auth.login({ email, password });
    localStorage.setItem('auth_token', response.session.value);
    setUser(response.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const response = await backend.auth.register({ email, username, password });
    localStorage.setItem('auth_token', response.token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
