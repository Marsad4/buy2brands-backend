const express = require('express');
const router = express.Router();
const { submitConsultationRequest } = require('../controllers/consultation.controller');

router.post('/request', submitConsultationRequest);

module.exports = router;
