import { api } from '@/lib/http';

export const dashboardService = { get: () => api.get('/dashboard') };

export const studentService = {
  list: (params) => api.get('/students', params),
  get: (id) => api.get(`/students/${id}`),
};

export const activityService = {
  overview: () => api.get('/activities/overview'),
  list: (params) => api.get('/activities', params),
  create: (body) => api.post('/activities', body),
  update: (id, body) => api.put(`/activities/${id}`, body),
  remove: (id) => api.del(`/activities/${id}`),
};

export const incidentService = {
  list: (params) => api.get('/incidents', params),
  get: (id) => api.get(`/incidents/${id}`),
  create: (body) => api.post('/incidents', body),
  update: (id, body) => api.put(`/incidents/${id}`, body),
  uploadAttachment: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`/incidents/${id}/attachments`, fd);
  },
};

export const reportService = {
  insights: (params) => api.get('/reports/insights', params),
  listGenerated: () => api.get('/reports/generated'),
  generate: (body) => api.post('/reports/generated', body),
  download: (id) => api.get(`/reports/generated/${id}/download`, undefined, { responseType: 'blob' }),
};

export const trainingService = {
  overview: () => api.get('/training/overview'),
  courses: (params) => api.get('/training/courses', params),
  start: (id) => api.post(`/training/courses/${id}/start`),
  complete: (id) => api.post(`/training/courses/${id}/complete`),
  events: () => api.get('/training/events'),
};

export const schoolService = {
  get: () => api.get('/school'),
  update: (body) => api.put('/school', body),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.upload('/school/logo', fd);
  },
  removeLogo: () => api.del('/school/logo'),
  users: (params) => api.get('/school/users', params),
};

export const aiService = {
  conversations: () => api.get('/ai/conversations'),
  conversation: (id) => api.get(`/ai/conversations/${id}`),
  send: (message, conversationId) => api.post('/ai/chat', { message, conversationId }),
  remove: (id) => api.del(`/ai/conversations/${id}`),
};

export const notificationService = {
  list: () => api.get('/notifications'),
  markAllRead: () => api.post('/notifications/read-all'),
};
