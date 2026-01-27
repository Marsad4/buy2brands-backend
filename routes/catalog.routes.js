const express = require('express');
const router = express.Router();
const {
    getAllCatalog,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem
} = require('../controllers/catalog.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Get all catalog (available to authenticated users)
router.get('/', protect, getAllCatalog);

// Admin only routes
router.post('/', protect, admin, createCatalogItem);
router.put('/:id', protect, admin, updateCatalogItem);
router.delete('/:id', protect, admin, deleteCatalogItem);

module.exports = router;
