const Child = require('../models/Child');
const Elderly = require('../models/Elderly');
const User = require('../models/User');

// @desc    Global search across children, elderly and staff
// @route   GET /api/search
// @access  Private
exports.globalSearch = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.json({
                success: true,
                results: {
                    children: [],
                    elderly: [],
                    staff: []
                }
            });
        }

        const searchRegex = new RegExp(query, 'i');

        // Search Children
        const children = await Child.find({
            $or: [
                { name: searchRegex },
                { childId: searchRegex }
            ]
        }).limit(5).select('name childId photo status');

        // Search Elderly
        const elderly = await Elderly.find({
            name: searchRegex
        }).limit(5).select('name photo status');

        // Search Staff (Users with role 'staff')
        const staff = await User.find({
            role: 'staff',
            $or: [
                { name: searchRegex },
                { email: searchRegex }
            ]
        }).limit(5).select('name email role profileImage isActive');

        res.json({
            success: true,
            results: {
                children: children.map(c => ({
                    id: c._id,
                    title: c.name,
                    subtitle: c.childId,
                    image: c.photo,
                    type: 'children',
                    status: c.status,
                    link: `/children/${c._id}`
                })),
                elderly: elderly.map(e => ({
                    id: e._id,
                    title: e.name,
                    subtitle: 'Elderly Resident',
                    image: e.photo,
                    type: 'elderly',
                    status: e.status,
                    link: `/elderly/${e._id}`
                })),
                staff: staff.map(s => ({
                    id: s._id,
                    title: s.name,
                    subtitle: s.email,
                    image: s.profileImage,
                    type: 'staff',
                    status: s.isActive ? 'active' : 'inactive',
                    link: `/staff/${s._id}`
                }))
            }
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
};
