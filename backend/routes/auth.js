const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { clerkAuth } = require('../middleware/clerkAuth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Clerk-authenticated: get current user profile (role, permissions, shop)
router.get('/me/clerk', clerkAuth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id)
      .populate('shop', 'name slug')
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
        status: user.status,
        shop: user.shop,
        lastLogin: user.lastLogin,
        activeSessions: user.activeSessions,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get me (clerk) error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Force logout sessions for a worker (admin only)
router.post('/workers/:id/force-logout', clerkAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id.toString() === req.params.id;

    const target = await User.findOne({
      _id: req.params.id,
      shop: req.user.shop,
      isActive: true,
    });

    if (!target) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { sessionId, all, except } = req.body;

    if (sessionId) {
      // Remove specific session
      target.activeSessions = (target.activeSessions || []).filter(
        (s) => s.sessionId !== sessionId
      );
    } else if (all) {
      // Remove all sessions except the specified one
      target.activeSessions = (target.activeSessions || []).filter(
        (s) => except && s.sessionId === except
      );
    } else {
      // Clear all active sessions (backwards compatible)
      target.activeSessions = [];
    }

    if (target.activeSessions.length === 0) {
      target.status = 'offline';
    }
    await target.save();

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.shop.toString()).emit('worker:session-terminated', {
        workerId: target._id,
        sessionId: sessionId || null,
        all: !!all,
      });
    }

    res.status(200).json({ success: true, message: 'Sessions logged out' });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ success: false, message: 'Failed to logout sessions' });
  }
});

module.exports = router;
