import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (name, email, password) => api.post('/api/auth/register', { name, email, password }),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  becomeHost: () => api.post('/api/auth/become-host'),
};

export const propertiesAPI = {
  getProperties: (params) => api.get('/api/properties', { params }),
  getProperty: (id) => api.get(`/api/properties/${id}`),
  createProperty: (data) => api.post('/api/properties', data),
  updateProperty: (id, data) => api.put(`/api/properties/${id}`, data),
  deleteProperty: (id) => api.delete(`/api/properties/${id}`),
  getUserProperties: (userId) => api.get(`/api/properties/user/${userId}`),
};

export const bookingsAPI = {
  getBookings: () => api.get('/api/bookings'),
  getHostBookings: () => api.get('/api/bookings/host'),
  getBooking: (id) => api.get(`/api/bookings/${id}`),
  createBooking: (data) => api.post('/api/bookings', data),
  updateBookingStatus: (id, status) => api.put(`/api/bookings/${id}/status`, { status }),
  deleteBooking: (id) => api.delete(`/api/bookings/${id}`),
};

export const reviewsAPI = {
  getPropertyReviews: (propertyId) => api.get(`/api/reviews/${propertyId}`),
  getUserReviews: (userId) => api.get(`/api/reviews/user/${userId}`),
  createReview: (data) => api.post('/api/reviews', data),
  updateReview: (id, data) => api.put(`/api/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/api/reviews/${id}`),
  addResponse: (id, text) => api.post(`/api/reviews/${id}/response`, { text }),
};

export const cartAPI = {
  getCart: () => api.get('/api/cart'),
  addToCart: (data) => api.post('/api/cart/add', data),
  updateCartItem: (itemId, data) => api.put(`/api/cart/update/${itemId}`, data),
  removeFromCart: (itemId) => api.delete(`/api/cart/remove/${itemId}`),
  clearCart: () => api.delete('/api/cart/clear'),
};

export const ordersAPI = {
  getOrders: () => api.get('/api/orders'),
  getOrder: (id) => api.get(`/api/orders/${id}`),
  createOrder: (data) => api.post('/api/orders/create', data),
  processPayment: (id, data) => api.post(`/api/orders/${id}/payment`, data),
  createRazorpayOrder: (id) => api.post(`/api/orders/${id}/create-razorpay-order`),
  verifyRazorpayPayment: (id, data) => api.post(`/api/orders/${id}/verify-razorpay-payment`, data),
  cancelOrder: (id) => api.put(`/api/orders/${id}/cancel`),
};

export default api;
