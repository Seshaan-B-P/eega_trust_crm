// routes/child.js - Child management routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Mock children database (in memory)
let children = [
    {
        id: '1',
        childId: 'CH24001',
        name: 'Rahul Sharma',
        dateOfBirth: '2015-03-15',
        age: 9,
        gender: 'male',
        background: 'Orphaned in road accident',
        medicalHistory: 'None',
        allergies: 'Dust',
        bloodGroup: 'B+',
        status: 'active',
        dateOfAdmission: '2023-01-15',
        assignedStaff: '2',
        guardianInfo: {
            name: 'Local Police Station',
            relationship: 'guardian',
            phone: '100'
        },
        createdAt: '2023-01-15T10:00:00Z'
    },
    {
        id: '2',
        childId: 'CH24002',
        name: 'Priya Patel',
        dateOfBirth: '2017-07-22',
        age: 7,
        gender: 'female',
        background: 'Abandoned at hospital',
        medicalHistory: 'Asthma (mild)',
        allergies: 'None',
        bloodGroup: 'O+',
        status: 'active',
        dateOfAdmission: '2023-02-20',
        assignedStaff: '2',
        guardianInfo: {
            name: 'Government Hospital',
            relationship: 'temporary guardian',
            phone: '108'
        },
        createdAt: '2023-02-20T11:30:00Z'
    },
    {
        id: '3',
        childId: 'CH24003',
        name: 'Arun Kumar',
        dateOfBirth: '2013-11-30',
        age: 10,
        gender: 'male',
        background: 'Parents passed away in flood',
        medicalHistory: 'Malnutrition history',
        allergies: 'Milk',
        bloodGroup: 'A+',
        status: 'active',
        dateOfAdmission: '2023-03-10',
        assignedStaff: '2',
        createdAt: '2023-03-10T09:15:00Z'
    }
];

// Authentication middleware
const authenticate = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized`
            });
        }
        next();
    };
};

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Children route is working',
        endpoints: ['/test', '/', '/:id', 'POST /', 'PUT /:id', 'DELETE /:id']
    });
});

// Get all children
router.get('/', authenticate, (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        
        let filteredChildren = [...children];
        
        // Filter by status
        if (status) {
            filteredChildren = filteredChildren.filter(child => child.status === status);
        }
        
        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filteredChildren = filteredChildren.filter(child =>
                child.name.toLowerCase().includes(searchLower) ||
                child.childId.toLowerCase().includes(searchLower)
            );
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        
        const paginatedChildren = filteredChildren.slice(startIndex, endIndex);
        
        // Statistics
        const stats = {
            total: children.length,
            active: children.filter(c => c.status === 'active').length,
            discharged: children.filter(c => c.status === 'discharged').length,
            male: children.filter(c => c.gender === 'male').length,
            female: children.filter(c => c.gender === 'female').length
        };
        
        res.json({
            success: true,
            count: paginatedChildren.length,
            total: filteredChildren.length,
            page: pageNum,
            totalPages: Math.ceil(filteredChildren.length / limitNum),
            stats,
            children: paginatedChildren
        });
        
    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get child by ID
router.get('/:id', authenticate, (req, res) => {
    try {
        const child = children.find(c => c.id === req.params.id || c.childId === req.params.id);
        
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }
        
        res.json({
            success: true,
            child
        });
        
    } catch (error) {
        console.error('Get child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create new child (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
    try {
        const childData = req.body;
        
        // Validation
        if (!childData.name || !childData.dateOfBirth || !childData.gender || !childData.background) {
            return res.status(400).json({
                success: false,
                message: 'Name, date of birth, gender, and background are required'
            });
        }
        
        // Generate child ID
        const lastChild = children[children.length - 1];
        let sequence = 1;
        if (lastChild && lastChild.childId) {
            const lastSequence = parseInt(lastChild.childId.slice(-3)) || 0;
            sequence = lastSequence + 1;
        }
        const childId = `CH24${sequence.toString().padStart(3, '0')}`;
        
        // Calculate age
        const dob = new Date(childData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        // Create new child
        const newChild = {
            id: (children.length + 1).toString(),
            childId,
            name: childData.name,
            dateOfBirth: childData.dateOfBirth,
            age,
            gender: childData.gender,
            background: childData.background,
            medicalHistory: childData.medicalHistory || 'None',
            allergies: childData.allergies || 'None',
            bloodGroup: childData.bloodGroup || null,
            status: 'active',
            dateOfAdmission: new Date().toISOString().split('T')[0],
            assignedStaff: childData.assignedStaff || null,
            guardianInfo: childData.guardianInfo || null,
            createdAt: new Date().toISOString()
        };
        
        children.push(newChild);
        
        res.status(201).json({
            success: true,
            message: 'Child created successfully',
            child: newChild
        });
        
    } catch (error) {
        console.error('Create child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating child'
        });
    }
});

// Update child (admin only)
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
    try {
        const childId = req.params.id;
        const updateData = req.body;
        
        const childIndex = children.findIndex(c => c.id === childId || c.childId === childId);
        
        if (childIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }
        
        // Update child data
        children[childIndex] = {
            ...children[childIndex],
            ...updateData,
            // Don't allow changing ID
            id: children[childIndex].id,
            childId: children[childIndex].childId
        };
        
        // Recalculate age if date of birth changed
        if (updateData.dateOfBirth) {
            const dob = new Date(updateData.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            children[childIndex].age = age;
        }
        
        res.json({
            success: true,
            message: 'Child updated successfully',
            child: children[childIndex]
        });
        
    } catch (error) {
        console.error('Update child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating child'
        });
    }
});

// Delete child (admin only - soft delete)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
    try {
        const childId = req.params.id;
        
        const childIndex = children.findIndex(c => c.id === childId || c.childId === childId);
        
        if (childIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }
        
        // Soft delete - change status to discharged
        children[childIndex].status = 'discharged';
        children[childIndex].dischargeDate = new Date().toISOString().split('T')[0];
        
        res.json({
            success: true,
            message: 'Child discharged successfully',
            child: children[childIndex]
        });
        
    } catch (error) {
        console.error('Delete child error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting child'
        });
    }
});

// Get child statistics
router.get('/stats/overview', authenticate, (req, res) => {
    try {
        const stats = {
            total: children.length,
            active: children.filter(c => c.status === 'active').length,
            discharged: children.filter(c => c.status === 'discharged').length,
            gender: {
                male: children.filter(c => c.gender === 'male').length,
                female: children.filter(c => c.gender === 'female').length
            },
            ageGroups: {
                '0-5': children.filter(c => c.age >= 0 && c.age <= 5).length,
                '6-10': children.filter(c => c.age >= 6 && c.age <= 10).length,
                '11-15': children.filter(c => c.age >= 11 && c.age <= 15).length,
                '16-18': children.filter(c => c.age >= 16 && c.age <= 18).length
            }
        };
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting statistics'
        });
    }
});

module.exports = router;