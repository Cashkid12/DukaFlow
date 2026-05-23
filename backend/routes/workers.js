const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
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
} = require('../controllers/workerController');

// All routes are protected with Clerk auth
router.use(clerkAuth);

// Invite must come before /:id
router.post('/invite', inviteWorker);

router.route('/')
  .get(getWorkers);

// Performance / transactions / activity — BEFORE /:id
router.get('/:id/performance', getWorkerPerformance);
router.get('/:id/transactions', getWorkerTransactions);
router.get('/:id/activity', getWorkerActivity);

router.get('/:id', getWorker);
router.put('/:id', updateWorker);
router.delete('/:id', removeWorker);
router.post('/:id/resend-invite', resendInvite);

module.exports = router;
