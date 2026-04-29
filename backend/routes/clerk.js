const express = require('express');
const router = express.Router();
const { handleClerkWebhook } = require('../controllers/clerkWebhookController');

/**
 * Clerk Webhook Endpoint
 * POST /api/clerk/webhook
 * 
 * Receives and processes Clerk user events
 * Must be configured in Clerk Dashboard → Webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleClerkWebhook);

module.exports = router;
