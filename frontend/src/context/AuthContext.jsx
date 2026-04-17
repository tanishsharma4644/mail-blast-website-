import { createContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { authApi } from '../api/auth';
import {
  attachUnauthorizedHandler,
  clearAccessToken,
  setAccessToken,
} from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = async ({ silent = false } = {}) => {
    try {
      await authApi.logout();
    } catch (_error) {
      // Ignore server logout errors during forced sign out.
    }

    clearAccessToken();
    setToken(null);
    setUser(null);
    if (!silent) toast.success('Logged out');
  };

  useEffect(() => {
    attachUnauthorizedHandler(() => {
      signOut({ silent: true });
      toast.error('Session expired. Please login again.');
    });

    const bootstrap = async () => {
      try {
        const { data: refreshData } = await authApi.refresh();
        setAccessToken(refreshData.accessToken);
        setToken(refreshData.accessToken);
        const { data: meData } = await authApi.me();
        setUser(meData.user);
      } catch (_error) {
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const sendLoginOtp = async (payload) => authApi.login(payload);

  const verifyLoginOtp = async (payload) => {
    const { data } = await authApi.verifyLoginOtp(payload);
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const verifyOtp = async (payload) => {
    const { data } = await authApi.verifyOtp(payload);
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const sendOtp = async (payload) => authApi.sendOtp(payload);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      sendLoginOtp,
      verifyLoginOtp,
      sendOtp,
      verifyOtp,
      signOut,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
