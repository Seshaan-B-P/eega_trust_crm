import api from '../utils/api';

const elderlyService = {
    // Get all elderly people
    getElderly: async (params) => {
        const response = await api.get('/elderly', { params });
        return response.data;
    },

    // Get single elderly person
    getElderlyById: async (id) => {
        const response = await api.get(`/elderly/${id}`);
        return response.data;
    },

    // Create new elderly record
    createElderly: async (elderlyData) => {
        const response = await api.post('/elderly', elderlyData);
        return response.data;
    },

    // Update elderly record
    updateElderly: async (id, elderlyData) => {
        const response = await api.put(`/elderly/${id}`, elderlyData);
        return response.data;
    },

    // Delete elderly record
    deleteElderly: async (id) => {
        const response = await api.delete(`/elderly/${id}`);
        return response.data;
    },

    // Add activity log
    addActivityLog: async (id, activityData) => {
        const response = await api.post(`/elderly/${id}/activities`, activityData);
        return response.data;
    },

    // Upload photo
    uploadPhoto: async (id, formData) => {
        const response = await api.post(`/elderly/${id}/photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Delete photo
    deletePhoto: async (id) => {
        const response = await api.delete(`/elderly/${id}/photo`);
        return response.data;
    },

    // Get statistics
    getElderlyStats: async () => {
        const response = await api.get('/elderly/stats');
        return response.data;
    }
};

export default elderlyService;