const Staff = require('../models/Staff');

/**
 * Automatically selects a staff member for assignment based on role and workload.
 * @param {string} department - The department to search in (e.g., 'caretaker').
 * @returns {Promise<string|null>} - The user ID of the selected staff member or null.
 */
const autoAssignStaff = async (department = 'caretaker') => {
    try {
        // Find all active staff in the specified department who are under capacity
        const availableStaff = await Staff.find({
            department: department,
            isActive: true,
            $expr: { $lt: ["$assignedChildrenCount", "$maxChildrenCapacity"] }
        }).sort({ assignedChildrenCount: 1 }); // Sort by least loaded first

        if (availableStaff.length === 0) {
            console.log(`No available staff found for department: ${department}`);
            return null;
        }

        // Return the user ID of the staff member with the lowest workload
        return availableStaff[0].user;
    } catch (error) {
        console.error('Error in autoAssignStaff:', error);
        return null;
    }
};

module.exports = {
    autoAssignStaff
};
