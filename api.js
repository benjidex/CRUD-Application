/**
 * api.js — centralized API service
 * Swap BASE_URL to point at your deployed server or change to MongoDB/PostgreSQL backend
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const msg = data.errors ? data.errors.join(', ') : (data.error || 'Request failed');
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Tasks CRUD
  getTasks:   (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v && v !== 'all')
    ).toString();
    return request('GET', `/tasks${qs ? `?${qs}` : ''}`);
  },
  getTask:    (id)          => request('GET',    `/tasks/${id}`),
  createTask: (data)        => request('POST',   '/tasks', data),
  updateTask: (id, data)    => request('PUT',    `/tasks/${id}`, data),
  patchTask:  (id, data)    => request('PATCH',  `/tasks/${id}`, data),
  deleteTask: (id)          => request('DELETE', `/tasks/${id}`),

  // Stats
  getStats: () => request('GET', '/stats'),
  getHealth: () => request('GET', '/health'),
};
