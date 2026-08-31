// Product service — browse and filter products API calls
import api from './api';

export const productService = {
  async getProducts({ category, brand, ecosystem, minPrice, maxPrice, minRating, search, sortBy, page, perPage } = {}) {
    const params = {};
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (ecosystem) params.ecosystem = ecosystem;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (minRating) params.min_rating = minRating;
    if (search) params.search = search;
    if (sortBy) params.sort_by = sortBy;
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;

    const response = await api.get('/api/v1/products/', { params });
    return response.data;
  },

  async getBrands() {
    const response = await api.get('/api/v1/products/brands');
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/api/v1/products/categories');
    return response.data;
  },
};
