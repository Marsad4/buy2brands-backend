const express = require('express');
const router = express.Router();
const returnRequestController = require('../controllers/returnRequest.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Public/User routes
router.post('/', protect, returnRequestController.createReturnRequest);
router.get('/my-requests', protect, returnRequestController.getMyReturnRequests);

// Admin routes
router.get('/', protect, admin, returnRequestController.getAllReturnRequests);
router.put('/:id', protect, admin, returnRequestController.updateReturnRequestStatus);

module.exports = router;
