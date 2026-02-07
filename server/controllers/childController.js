// Simple child controller for testing
exports.getAllChildren = async (req, res) => {
    try {
        res.json({
            success: true,
            count: 3,
            children: [
                { id: 1, name: 'Rahul Sharma', age: 10, gender: 'male' },
                { id: 2, name: 'Priya Patel', age: 8, gender: 'female' },
                { id: 3, name: 'Arun Kumar', age: 12, gender: 'male' }
            ]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getChildById = async (req, res) => {
    try {
        res.json({
            success: true,
            child: {
                id: req.params.id,
                name: 'Sample Child',
                age: 10,
                gender: 'male',
                background: 'Sample background'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};