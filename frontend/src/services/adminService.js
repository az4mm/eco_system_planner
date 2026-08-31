// Admin service — API calls for admin dashboard
import api from './api';

export const adminService = {
  async adminLogin(username, password) {
    const response = await api.post('/api/v1/admin/login', { username, password });
    return response.data;
  },

  async getStats() {
    const response = await api.get('/api/v1/admin/stats');
    return response.data;
  },

  // Product CRUD
  async createProduct(productData) {
    const response = await api.post('/api/v1/admin/products', productData);
    return response.data;
  },

  async updateProduct(productId, productData) {
    const response = await api.put(`/api/v1/admin/products/${productId}`, productData);
    return response.data;
  },

  async deleteProduct(productId) {
    const response = await api.delete(`/api/v1/admin/products/${productId}`);
    return response.data;
  },

  // Admin Self-Update
  async updateAdminSelf(adminId, data) {
    const response = await api.put('/api/v1/admin/me', data, {
      headers: { 'X-Admin-Id': String(adminId) },
    });
    return response.data;
  },

  // Admin Management
  async listAdmins() {
    const response = await api.get('/api/v1/admin/admins');
    return response.data;
  },

  async createAdmin(username, password, currentAdminId) {
    const response = await api.post('/api/v1/admin/admins', { username, password }, {
      headers: { 'X-Admin-Id': String(currentAdminId) },
    });
    return response.data;
  },

  async deleteAdmin(adminId, currentAdminId) {
    const response = await api.delete(`/api/v1/admin/admins/${adminId}`, {
      headers: { 'X-Admin-Id': String(currentAdminId) },
    });
    return response.data;
  },
};
