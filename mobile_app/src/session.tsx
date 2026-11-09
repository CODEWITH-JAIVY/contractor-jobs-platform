import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setToken, setUnauthorizedHandler } from './api';
import { googleSignOut } from './native/google';
import type { Role } from './types';

type Auth = { token: string; role: Role; userId: number };
type Ctx = {
  ready: boolean;
  token: string | null;
  role: Role | null;
  userId: number | null;
  login: (a: Auth) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync('token');
        const r = await SecureStore.getItemAsync('role');
        const u = await SecureStore.getItemAsync('uid');
        if (t && r && u) {
          setToken(t);
          setAuth({ token: t, role: r as Role, userId: Number(u) });
        }
      } catch {
        // storage kharab ho to fresh login
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (a: Auth) => {
    setToken(a.token);
    setAuth(a);
    await SecureStore.setItemAsync('token', a.token);
    await SecureStore.setItemAsync('role', a.role);
    await SecureStore.setItemAsync('uid', String(a.userId));
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setAuth(null);
    await Promise.all(['token', 'role', 'uid'].map((k) => SecureStore.deleteItemAsync(k).catch(() => undefined)));
    await googleSignOut();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<Ctx>(
    () => ({ ready, token: auth?.token ?? null, role: auth?.role ?? null, userId: auth?.userId ?? null, login, logout }),
    [ready, auth, login, logout],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): Ctx {
  const c = useContext(SessionCtx);
  if (!c) throw new Error('SessionProvider missing');
  return c;
}
