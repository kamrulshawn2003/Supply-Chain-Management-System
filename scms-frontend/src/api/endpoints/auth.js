// src/api/endpoints/auth.js
import api from '../index';

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  // Removed broken getProfile: /users returns full user list, not current user profile
};