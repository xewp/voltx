import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // Required for httpOnly cookie to be sent/received cross-origin
  withCredentials: true,
});

// NOTE: No manual Authorization header injection needed — the browser automatically
// sends the httpOnly cookie. The 401 redirect is handled by useAxiosInterceptor
// (a React hook inside the component tree) to use React Router's navigate().

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const secretsAPI = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get('/secrets', { params }),
  create: (data: object) => api.post('/secrets', data),
  update: (id: string, data: object) => api.put(`/secrets/${id}`, data),
  remove: (id: string) => api.delete(`/secrets/${id}`),
};

export default api;
