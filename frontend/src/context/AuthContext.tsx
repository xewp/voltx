import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: validate session by calling /me — the httpOnly cookie is sent automatically.
  // This replaces the old localStorage token presence check (which didn't validate expiry).
  useEffect(() => {
    const stored = localStorage.getItem('vaultx_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('vaultx_user');
      }
    }

    // Always re-validate with the server, even if we have cached user data
    authAPI
      .me()
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('vaultx_user', JSON.stringify(data));
      })
      .catch(() => {
        // Session invalid / cookie expired — clear any stale user data
        setUser(null);
        localStorage.removeItem('vaultx_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    // Backend sets the httpOnly cookie — we only store non-sensitive user display data
    setUser(data.user);
    localStorage.setItem('vaultx_user', JSON.stringify(data.user));
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await authAPI.register({ name, email, password });
    setUser(data.user);
    localStorage.setItem('vaultx_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      await authAPI.logout(); // asks backend to clear the httpOnly cookie
    } catch {
      // Even if the request fails, clear client state
    }
    setUser(null);
    localStorage.removeItem('vaultx_user');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
