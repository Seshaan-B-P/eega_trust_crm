const InventoryItem = require('../models/InventoryItem');
const InventoryLog = require('../models/InventoryLog');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getInventory = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const items = await InventoryItem.find(query).sort({ name: 1 });

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory',
            error: error.message
        });
    }
};

// @desc    Get single inventory item with logs
// @route   GET /api/inventory/:id
// @access  Private
exports.getItemById = async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const logs = await InventoryLog.find({ item: req.params.id })
            .populate('performedBy', 'name')
            .sort({ date: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                item,
                logs
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching item',
            error: error.message
        });
    }
};

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private (Admin only)
exports.createItem = async (req, res) => {
    try {
        const itemData = {
            ...req.body,
            createdBy: req.user.id
        };

        const item = await InventoryItem.create(itemData);

        // Notify admins if created by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'New Inventory Item Added',
                message: `Staff ${req.user.name} added a new inventory item: ${item.name}`,
                type: 'inventory',
                data: { itemId: item._id },
                createdBy: req.user.id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Item created successfully',
            data: item
        });
    } catch (error) {
        console.error('Error in createItem:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating item',
            error: error.message
        });
    }
};

// @desc    Update stock level
// @route   PATCH /api/inventory/:id/stock
// @access  Private
exports.updateStock = async (req, res) => {
    try {
        const { type, quantity, reason } = req.body;
        console.log(`Stock Update Request: type=${type}, quantity=${quantity}, reason=${reason}, itemId=${req.params.id}`);

        if (!type || !quantity || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Type, quantity, and reason are required'
            });
        }

        const item = await InventoryItem.findById(req.params.id);
        if (!item) {
            console.log('Item not found during stock update');
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const oldQuantity = Number(item.quantity);
        const numQuantity = Number(quantity);
        let newQuantity = oldQuantity;

        if (type === 'in') {
            newQuantity += numQuantity;
        } else if (type === 'out') {
            newQuantity -= numQuantity;
        } else if (type === 'adjustment') {
            newQuantity = numQuantity;
        }

        if (isNaN(newQuantity) || newQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quantity or resulting stock would be negative'
            });
        }

        console.log(`Updating item ${item.name}: ${oldQuantity} -> ${newQuantity}`);

        item.quantity = newQuantity;
        item.lastUpdated = Date.now();
        await item.save();

        // Calculate delta for the log
        const delta = type === 'adjustment' ? (newQuantity - oldQuantity) : (type === 'out' ? -numQuantity : numQuantity);

        // Create log entry
        const log = await InventoryLog.create({
            item: item._id,
            type,
            quantity: Math.abs(delta), // Store as positive magnitude
            reason,
            performedBy: req.user.id
        });

        console.log('Stock updated and log created successfully');

        // Notify admins if updated by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Inventory Stock Updated',
                message: `Staff ${req.user.name} updated stock for ${item.name}: ${oldQuantity} -> ${newQuantity} (${type})`,
                type: 'inventory',
                data: { itemId: item._id, type, quantity: numQuantity },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: item
        });
    } catch (error) {
        const fs = require('fs');
        const logMsg = `${new Date().toISOString()} - Error in updateStock: ${error.stack}\n`;
        fs.appendFileSync('inventory_error.log', logMsg);
        console.error('Error in updateStock controller:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating stock',
            error: error.message
        });
    }
};

// @desc    Update inventory item details
// @route   PUT /api/inventory/:id
// @access  Private (Admin only)
exports.updateItem = async (req, res) => {
    try {
        let item = await InventoryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Notify admins if updated by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Inventory Item Details Updated',
                message: `Staff ${req.user.name} updated details for ${item.name}`,
                type: 'inventory',
                data: { itemId: item._id },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Item updated successfully',
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating item',
            error: error.message
        });
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin only)
exports.deleteItem = async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Delete associated logs
        await InventoryLog.deleteMany({ item: req.params.id });
        await item.deleteOne();

        // Notify admins if deleted by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Inventory Item Deleted',
                message: `Staff ${req.user.name} deleted inventory item: ${item.name}`,
                type: 'inventory',
                data: { itemId: item._id },
                createdBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting item',
            error: error.message
        });
    }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats/summary
// @access  Private
exports.getInventoryStats = async (req, res) => {
    try {
        const totalItems = await InventoryItem.countDocuments();
        const lowStockItems = await InventoryItem.countDocuments({
            $expr: { $lte: ['$quantity', '$minThreshold'] }
        });
        const outOfStockItems = await InventoryItem.countDocuments({ quantity: 0 });

        const categoryStats = await InventoryItem.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                totalItems,
                lowStockItems,
                outOfStockItems,
                categoryStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory stats',
            error: error.message
        });
    }
};
