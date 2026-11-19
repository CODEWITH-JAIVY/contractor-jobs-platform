import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setToken, setUnauthorizedHandler } from './api';
import { googleSignOut } from './native/google';
import { resetPush, stopPush } from './native/push';
import type { Role } from './types';

type Auth = { token: string; role: Role; userId: number };
type Ctx = {
  ready: boolean; token: string | null; role: Role | null; userId: number | null;
  login: (a: Auth) => Promise<void>; logout: () => Promise<void>;
};
const SessionCtx = createContext<Ctx | null>(null);
const KEY = 'session_v1';
const valid = (a: Auth) => a && typeof a.token === 'string' && a.token.length > 0 &&
  ['USER', 'CONTRACTOR', 'ADMIN'].includes(a.role) && Number.isSafeInteger(a.userId) && a.userId > 0;
const clearLegacy = () => Promise.all(['token', 'role', 'uid'].map(k => SecureStore.deleteItemAsync(k)));
let storageQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = storageQueue.then(operation, operation);
  storageQueue = next.catch(() => undefined);
  return next;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);
  useEffect(() => {
    let active = true;
    void serialize(async () => {
      try {
        const stored = await SecureStore.getItemAsync(KEY);
        const a: Auth = stored ? JSON.parse(stored) : {
          token: await SecureStore.getItemAsync('token') ?? '',
          role: await SecureStore.getItemAsync('role') as Role,
          userId: Number(await SecureStore.getItemAsync('uid')),
        };
        if (valid(a)) {
          await SecureStore.setItemAsync(KEY, JSON.stringify(a));
          await clearLegacy();
          if (active) { setToken(a.token); setAuth(a); }
        }
      } catch { /* Invalid/inaccessible storage requires a fresh login. */ }
      finally { if (active) setReady(true); }
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (a: Auth) => {
    if (!valid(a)) throw new Error('Invalid sign-in response. Please try again.');
    await serialize(async () => {
      await SecureStore.setItemAsync(KEY, JSON.stringify(a));
      await clearLegacy();
    });
    resetPush();
    setToken(a.token);
    setAuth(a);
  }, []);
  const logout = useCallback(async () => {
    // Capture the old Authorization header before clearing the in-memory session.
    const unregister = api.del('/users/me/fcm-token').catch(() => undefined);
    setToken(null);
    setAuth(null);
    resetPush();
    await Promise.all([
      unregister, stopPush(), googleSignOut(),
      serialize(async () => {
        // A tombstone prevents fallback to legacy credentials on a partial deletion.
        await SecureStore.setItemAsync(KEY, 'null');
        await clearLegacy();
      }).catch(() => undefined),
    ]);
  }, []);
  useEffect(() => {
    setUnauthorizedHandler(() => { void logout(); });
    return () => setUnauthorizedHandler(null);
  }, [logout]);
  const value = useMemo<Ctx>(() => ({ ready, token: auth?.token ?? null, role: auth?.role ?? null,
    userId: auth?.userId ?? null, login, logout }), [ready, auth, login, logout]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
export function useSession(): Ctx {
  const c = useContext(SessionCtx);
  if (!c) throw new Error('SessionProvider missing');
  return c;
}
