const express = require('express');
const router = express.Router();
const {
    getAllShippingStructures,
    getAllShippingStructuresAdmin,
    getShippingStructure,
    createShippingStructure,
    updateShippingStructure,
    deleteShippingStructure,
    calculateShippingCost
} = require('../controllers/shippingStructure.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getAllShippingStructures);
router.get('/:id', getShippingStructure);
router.post('/:id/calculate', calculateShippingCost);

// Admin routes
router.get('/admin/all', protect, admin, getAllShippingStructuresAdmin);
router.post('/', protect, admin, createShippingStructure);
router.put('/:id', protect, admin, updateShippingStructure);
router.delete('/:id', protect, admin, deleteShippingStructure);

module.exports = router;
