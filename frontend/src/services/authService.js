// Auth service — login, register, get profile API calls
import api from './api';

export const authService = {
  async register(name, email, password, preferredEcosystem = null) {
    const response = await api.post('/api/v1/auth/register', {
      name,
      email,
      password,
      preferred_ecosystem: preferredEcosystem,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/api/v1/auth/login', { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
