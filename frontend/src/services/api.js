import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Articles API
export const articlesAPI = {
  // Get all articles
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get('/articles', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get single article
  getById: async (id) => {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },

  // Get original version
  getOriginal: async (id) => {
    const response = await api.get(`/articles/${id}/original`);
    return response.data;
  },

  // Get updated version
  getUpdated: async (id) => {
    const response = await api.get(`/articles/${id}/updated`);
    return response.data;
  },

  // Create article
  create: async (articleData) => {
    const response = await api.post('/articles', articleData);
    return response.data;
  },

  // Update article
  update: async (id, articleData) => {
    const response = await api.put(`/articles/${id}`, articleData);
    return response.data;
  },

  // Delete article
  delete: async (id) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  },

  // Trigger scraping
  triggerScraping: async () => {
    const response = await api.post('/articles/scrape');
    return response.data;
  },

  // Enhance single article
  enhanceArticle: async (id) => {
    const response = await api.post(`/articles/${id}/enhance`);
    return response.data;
  },

  // Enhance all articles
  enhanceAllArticles: async () => {
    const response = await api.post('/articles/enhance/all');
    return response.data;
  },
};

export default api;

