// Product service — list, search, filter products API calls
import api from './api';

export const productService = {
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/v1/products/?${params.toString()}`);
    return response.data;
  },

  async searchProducts(query) {
    const response = await api.get(`/api/v1/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getProduct(productId) {
    const response = await api.get(`/api/v1/products/${productId}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/api/v1/products/categories');
    return response.data;
  },

  async getEcosystems() {
    const response = await api.get('/api/v1/products/ecosystems');
    return response.data;
  },

  async getUsageProfiles() {
    const response = await api.get('/api/v1/products/usage-profiles');
    return response.data;
  },
};
