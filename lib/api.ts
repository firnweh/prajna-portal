function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('prajna_token='))
    ?.split('=')[1] ?? null;
}

async function fetchWithAuth(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    document.cookie = 'prajna_token=; Max-Age=0; path=/';
    window.location.href = '/login';
  }
  return res;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const INTEL = process.env.NEXT_PUBLIC_INTEL_URL || '';

export const backend = (path: string, opts?: RequestInit) =>
  fetchWithAuth(`${BACKEND}${path}`, opts);

export const intelligence = (path: string, opts?: RequestInit) =>
  fetchWithAuth(`${INTEL}${path}`, opts);
