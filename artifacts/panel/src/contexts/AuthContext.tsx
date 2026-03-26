import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AuthUser, useGetMe, login as apiLogin, logout as apiLogout } from '@workspace/api-client-react';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (login: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const { data, isLoading: meLoading, error } = useGetMe({
    query: {
      retry: false,
    }
  });

  useEffect(() => {
    if (!meLoading) {
      if (data) {
        setUser(data);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [meLoading, data, error]);

  const login = async (loginStr: string, pass: string) => {
    try {
      const userData = await apiLogin({ login: loginStr, password: pass });
      setUser(userData);
    } catch (e: any) {
      throw new Error(e?.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setLocation('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
