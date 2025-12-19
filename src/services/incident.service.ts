import api from '../utils/api';

export interface IncidentData {
  name: string;
  contact: string;
  vehicleNo?: string;
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  witnessInfo?: string;
  severity?: string;
}

export const incidentAPI = {
  createIncident: async (data: IncidentData, files?: File[]) => {
    const formData = new FormData();
    
    // Append text fields
    formData.append('name', data.name);
    formData.append('contact', data.contact);
    formData.append('location', data.location);
    formData.append('coordinates', JSON.stringify(data.coordinates));
    formData.append('description', data.description);
    
    if (data.vehicleNo) formData.append('vehicleNo', data.vehicleNo);
    if (data.witnessInfo) formData.append('witnessInfo', data.witnessInfo);
    if (data.severity) formData.append('severity', data.severity);
    
    // Append files
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await api.post('/incidents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getIncidents: async (filters?: { status?: string; severity?: string; limit?: number }) => {
    const response = await api.get('/incidents', { params: filters });
    return response.data;
  },

  getIncident: async (id: string) => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  getMyReports: async () => {
    const response = await api.get('/incidents/my-reports');
    return response.data;
  },

  updateIncident: async (id: string, data: any) => {
    const response = await api.put(`/incidents/${id}`, data);
    return response.data;
  },

  deleteIncident: async (id: string) => {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/incidents/stats/overview');
    return response.data;
  }
};
