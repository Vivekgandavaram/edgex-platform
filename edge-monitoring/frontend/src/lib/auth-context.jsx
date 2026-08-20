import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { endpoints } from './api';
import { disconnectSocket } from './socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  const hydrate = useCallback(async () => {
    const token = localStorage.getItem('edgex_access_token');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    try {
      const res = await endpoints.me();
      setUser(res.data.user);
      setStatus('authenticated');
    } catch {
      localStorage.removeItem('edgex_access_token');
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  const applySession = (data) => {
    localStorage.setItem('edgex_access_token', data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  };

  const login = async (email, password) => applySession((await endpoints.login({ email, password })).data);
  const loginWithGoogle = async (idToken) => applySession((await endpoints.googleLogin(idToken)).data);
  const loginWithOtp = async (email, code) => applySession((await endpoints.verifyOtp(email, code)).data);

  const logout = async () => {
    try { await endpoints.logout(); } catch { /* best effort */ }
    localStorage.removeItem('edgex_access_token');
    disconnectSocket();
    setUser(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, status, login, loginWithGoogle, loginWithOtp, logout, refresh: hydrate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
