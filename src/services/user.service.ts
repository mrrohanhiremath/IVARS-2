import api from '../utils/api';

export const userAPI = {
  getResponders: async () => {
    const response = await api.get('/users/responders');
    return response.data;
  },
  
  updateResponderStatus: async (status: 'available' | 'busy' | 'offline') => {
    const response = await api.put('/users/profile', { responderStatus: status });
    return response.data;
  },

  updateLocation: async (location: string) => {
    const response = await api.put('/users/profile', { location });
    return response.data;
  }
};
