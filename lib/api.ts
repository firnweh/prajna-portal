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

// All calls go through Next.js API proxy routes — no CORS issues
export const backend = (path: string, opts?: RequestInit) =>
  fetchWithAuth(`/api/proxy/backend${path}`, opts);

export const intelligence = (path: string, opts?: RequestInit) =>
  fetchWithAuth(`/api/proxy/intel${path}`, opts);
