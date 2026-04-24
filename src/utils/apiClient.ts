/**
 * apiClient – a fetch wrapper that transparently refreshes the access token
 * when a 401 is received, and retries the original request once.
 *
 * Usage (same signature as native fetch):
 *   const res = await apiClient('/api/profile', { method: 'GET' });
 */

const BACKEND_URL = '';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function saveTokens(token: string, refreshToken: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

/** Attempt to get a new access token using the stored refresh token. */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      saveTokens(data.token, data.refreshToken);
      return data.token;
    }
  } catch {
    /* network error – fall through */
  }

  // Refresh failed – clear everything and redirect to login
  clearTokens();
  window.dispatchEvent(new Event('sessionExpired'));
  return null;
}

/**
 * Drop-in replacement for fetch that:
 *   1. Injects the Authorization header automatically.
 *   2. On 401, tries to refresh the token once and retries.
 *   3. On second 401, clears storage and fires `sessionExpired` event.
 */
export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const makeRequest = (accessToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    return fetch(`${BACKEND_URL}${url}`, { ...options, headers });
  };

  let response = await makeRequest(token);

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await makeRequest(newToken);
    }
  }

  return response;
}
