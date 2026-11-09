import { isKnownServerMsg, serverMsg, tr } from './i18n';

/** Backend se baat: fetch + JWT. API_URL: emulator 10.0.2.2, real phone me laptop ka IP. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (t: string | null) => {
  token = t;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, tr('err.network'));
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const d = (data ?? {}) as { error?: string; fields?: Record<string, string> };
    let msg: string;
    if (d.fields) {
      const known = Object.values(d.fields).filter(isKnownServerMsg);
      msg = known.length ? known.map(serverMsg).join('\n') : tr('err.validation');
    } else {
      msg = d.error ? serverMsg(d.error) : tr('err.status', { status: res.status });
    }
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};

export function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  return tr('err.generic');
}
