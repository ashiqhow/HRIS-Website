import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hris_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hris_token');
      if (storedToken) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.success) {
            setUser(data.user);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('hris_token');
          localStorage.removeItem('hris_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('hris_token', data.token);
      localStorage.setItem('hris_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    }
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    if (data.success) {
      localStorage.setItem('hris_token', data.token);
      localStorage.setItem('hris_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    }
  };

  const logout = () => {
    localStorage.removeItem('hris_token');
    localStorage.removeItem('hris_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('hris_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const updateLocalUser = (updated) => {
    setUser(updated);
    localStorage.setItem('hris_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
