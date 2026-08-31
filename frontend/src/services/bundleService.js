// Bundle service — generate, compare, save bundles API calls
import api from './api';

export const bundleService = {
  async generateBundles(budget, ecosystem, usageProfile) {
    const response = await api.post('/api/v1/bundles/generate', {
      budget: parseFloat(budget),
      ecosystem,
      usage_profile: usageProfile,
    });
    return response.data;
  },

  async getBundle(bundleId) {
    const response = await api.get(`/api/v1/bundles/${bundleId}`);
    return response.data;
  },

  async compareBundles(bundleIds) {
    const response = await api.post('/api/v1/bundles/compare', {
      bundle_ids: bundleIds,
    });
    return response.data;
  },

  async saveBundle(bundleId) {
    const response = await api.post(`/api/v1/bundles/${bundleId}/save`);
    return response.data;
  },

  async getSavedBundles() {
    const response = await api.get('/api/v1/bundles/saved/list');
    return response.data;
  },

  async deleteSavedBundle(savedId) {
    const response = await api.delete(`/api/v1/bundles/saved/${savedId}`);
    return response.data;
  },
};
