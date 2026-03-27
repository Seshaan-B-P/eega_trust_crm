const express = require('express');
const router = express.Router();
const {
    getInventory,
    getItemById,
    createItem,
    updateStock,
    getInventoryStats,
    updateItem,
    deleteItem
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats/summary', getInventoryStats);

router.route('/')
    .get(getInventory)
    .post(authorize('admin', 'staff'), createItem);

router.route('/:id')
    .get(getItemById)
    .put(authorize('admin', 'staff'), updateItem)
    .delete(authorize('admin', 'staff'), deleteItem);

router.route('/:id/stock')
    .patch(updateStock);

module.exports = router;
