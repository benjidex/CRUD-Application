/**
 * api.js — centralized API service
 * Swap BASE_URL if you change backend location.
 * With Vite proxy, prefer '/api' (relative) so requests go to backend.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);

  // Some errors might not be JSON.
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.errors ? data.errors.join(', ') : (data?.error || `Request failed (${res.status})`);
    throw new Error(msg);
  }

  return data;
}

export const api = {
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v && v !== 'all')
    ).toString();

    return request('GET', `/tasks${qs ? `?${qs}` : ''}`);
  },

  getTask: (id) => request('GET', `/tasks/${id}`),
  createTask: (data) => request('POST', '/tasks', data),
  updateTask: (id, data) => request('PUT', `/tasks/${id}`, data),
  patchTask: (id, data) => request('PATCH', `/tasks/${id}`, data),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  getStats: () => request('GET', '/stats'),
  getHealth: () => request('GET', '/health'),
};

