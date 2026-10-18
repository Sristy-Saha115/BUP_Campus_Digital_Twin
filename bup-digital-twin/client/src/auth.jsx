import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => setToken(null));
  }, []);

    const authenticate = async (mode, form) => {
    const d = await api(`/auth/${mode}`, { method: 'POST', body: form });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };
  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ user, authenticate, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
