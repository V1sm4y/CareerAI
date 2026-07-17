import axios from 'axios';
import type { Token, User, JobApplication, ApplicationCreate, DashboardStats, Resume, AnalysisResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cf_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const authApi = {
  register: (data: { email: string; full_name: string; password: string }) =>
    api.post<User>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<Token>('/auth/login', data),

  me: () => api.get<User>('/auth/me'),
};

// --- Applications ---
export const applicationsApi = {
  list: () => api.get<JobApplication[]>('/applications/'),

  create: (data: ApplicationCreate) => api.post<JobApplication>('/applications/', data),

  update: (id: number, data: Partial<ApplicationCreate>) =>
    api.put<JobApplication>(`/applications/${id}`, data),

  delete: (id: number) => api.delete(`/applications/${id}`),

  dashboard: () => api.get<DashboardStats>('/applications/dashboard'),
};

// --- Resumes ---
export const resumesApi = {
  list: () => api.get<Resume[]>('/resumes/'),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Resume>('/resumes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  analyze: (id: number) => api.post<AnalysisResult>(`/resumes/${id}/analyze`),

  get: (id: number) => api.get<Resume>(`/resumes/${id}`),
};

export default api;
