const express = require('express');
const router = express.Router();
const { clerkAuth, optionalClerkAuth } = require('../middleware/clerkAuth');
const {
  getWorkers,
  getWorker,
  inviteWorker,
  updateWorker,
  removeWorker,
  resendInvite,
  getWorkerPerformance,
  getWorkerTransactions,
  getWorkerActivity,
  verifyInvitation,
  acceptInvitation,
  cancelInvite,
} = require('../controllers/workerController');

// ─── Public routes (no auth) ────────────────────────────────────────────
router.get('/verify-invitation', verifyInvitation);

// ─── Protected routes (auth required) ───────────────────────────────────

// Accept invitation — auth required (new Clerk user)
router.post('/accept-invitation', clerkAuth, acceptInvitation);

// All other routes are protected with Clerk auth
router.use(clerkAuth);

// Invite must come before /:id
router.post('/invite', inviteWorker);

router.route('/')
  .get(getWorkers);

// Performance / transactions / activity — BEFORE /:id
router.get('/:id/performance', getWorkerPerformance);
router.get('/:id/transactions', getWorkerTransactions);
router.get('/:id/activity', getWorkerActivity);
router.delete('/:id/cancel-invite', cancelInvite);

router.get('/:id', getWorker);
router.put('/:id', updateWorker);
router.delete('/:id', removeWorker);
router.post('/:id/resend-invite', resendInvite);

module.exports = router;
