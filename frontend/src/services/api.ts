export async function fetchWithAuth(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401 || res.status === 403) {
    // clear and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try { window.location.assign(window.location.origin + '/login'); } catch (e) {}
    throw new Error('Unauthorized');
  }
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data: json };
}

export async function getBlogsByCategory(category: string) {
  const q = encodeURIComponent(category || '');
  const url = `http://localhost:5000/blogs?category=${q}`;
  return fetchWithAuth(url);
}
