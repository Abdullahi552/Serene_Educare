import { api } from '@/lib/http';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }, { skipAuthRedirect: true }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  requestOnboarding: (body) => api.post('/onboarding-requests', body),
};
