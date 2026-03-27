import api from '../utils/api';

const userService = {
    // Get all staff members
    getStaff: () => {
        return api.get('/staff');
    },

    // Get available staff (for assignment)
    getAvailableStaff: () => {
        return api.get('/staff/available');
    },

    // Get staff by ID
    getStaffById: (id) => {
        return api.get(`/staff/${id}`);
    },

    // Create new staff
    createStaff: (data) => {
        return api.post('/staff', data);
    },

    // Update staff
    updateStaff: (id, data) => {
        return api.put(`/staff/${id}`, data);
    },

    // Delete staff
    deleteStaff: (id) => {
        return api.delete(`/staff/${id}`);
    }
};

export default userService;
