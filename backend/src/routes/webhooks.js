const express = require('express');
const webhookController = require('../controllers/webhookController');
const { validateWebhook } = require('../utils/validation');

const router = express.Router();

// Webhook endpoints
router.post('/analytics', validateWebhook, webhookController.handleAnalyticsWebhook);
router.post('/notifications', webhookController.handleNotificationWebhook);
router.get('/health', webhookController.healthCheck);

// Webhook management
router.post('/register', webhookController.registerWebhook);
router.get('/list', webhookController.listWebhooks);
router.delete('/unregister/:id', webhookController.unregisterWebhook);

module.exports = router; 