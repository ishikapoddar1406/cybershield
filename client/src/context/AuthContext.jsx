import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setCsrfToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setLocalCsrfToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);

  // Initialize and check active session
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      setLoading(true);
      const data = await apiRequest('/api/auth/me');
      if (data.authenticated && data.user) {
        setUser(data.user);
        setLocalCsrfToken(data.csrfToken);
        setCsrfToken(data.csrfToken);
        setMfaPending(false);
      } else {
        setUser(null);
        setLocalCsrfToken('');
        setCsrfToken('');
      }
    } catch (err) {
      setUser(null);
      setLocalCsrfToken('');
      setCsrfToken('');
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (data.mfaRequired) {
      setMfaPending(true);
      return { mfaRequired: true };
    }

    if (data.user) {
      setUser(data.user);
      setLocalCsrfToken(data.csrfToken);
      setCsrfToken(data.csrfToken);
      setMfaPending(false);
      return { success: true, user: data.user };
    }
    return data;
  }

  async function verifyMfa(token) {
    const data = await apiRequest('/api/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    if (data.user) {
      setUser(data.user);
      setLocalCsrfToken(data.csrfToken);
      setCsrfToken(data.csrfToken);
      setMfaPending(false);
      return { success: true, user: data.user };
    }
    return data;
  }

  async function register(userData) {
    return await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async function logout() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setLocalCsrfToken('');
      setCsrfToken('');
      setMfaPending(false);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      csrfToken,
      loading,
      mfaPending,
      setMfaPending,
      login,
      verifyMfa,
      register,
      logout,
      checkSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
