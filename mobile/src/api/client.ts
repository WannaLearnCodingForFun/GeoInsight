import { useAuth } from '@/src/auth/auth-provider';

export type ApiError = {
  status: number;
  bodyText: string;
};

export function useApiClient() {
  const { bearerToken } = useAuth();
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set('accept', 'application/json');
    if (!headers.get('content-type') && init?.body) headers.set('content-type', 'application/json');

    if (!bearerToken) {
      const err: ApiError = { status: 401, bodyText: 'Missing bearer token' };
      throw err;
    }
    headers.set('authorization', `Bearer ${bearerToken}`);

    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      const err: ApiError = { status: res.status, bodyText };
      throw err;
    }
    return (await res.json()) as T;
  }

  return { request };
}

