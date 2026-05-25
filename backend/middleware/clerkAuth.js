const clerk = require('@clerk/clerk-sdk-node');

/**
 * Clerk Authentication Middleware
 * Verifies Clerk session tokens and attaches user context to request
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token with Clerk
 * 3. Look up local User by clerkId
 * 4. Attach user and shop context to request
 */
exports.clerkAuth = async (req, res, next) => {
  try {
    // Fail fast if Clerk secret key is not configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ CLERK_SECRET_KEY is not set in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication provider is not configured',
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token with Clerk
    let session;
    try {
      console.log('🔑 Verifying token, secretKey present:', !!process.env.CLERK_SECRET_KEY, 'token length:', token.length);
      session = await clerk.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      console.error('   Error details:', error.status || error.code || 'no extra detail');
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Please sign in again'
      });
    }

    // Extract clerkId from session
    const clerkId = session.sub;

    if (!clerkId) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User ID not found in token'
      });
    }

    // Find user in MongoDB
    const User = require('../models/User');
    let user = await User.findOne({ clerkId, isActive: true, isDeleted: false });

    if (!user) {
      // Check if user exists but is inactive/deleted
      const userAny = await User.findOne({ clerkId });
      if (userAny) {
        console.log(`🔎 User exists but inactive/deleted: ${userAny.email} (active=${userAny.isActive}, deleted=${userAny.isDeleted})`);
        return res.status(401).json({ 
          error: 'Account disabled',
          message: 'Your account has been deactivated'
        });
      }

      // Auto-create user from Clerk data (webhook may not be configured yet)
      const email = session.email || session.emailAddresses?.[0]?.email_address;
      const fullName = [session.firstName, session.lastName].filter(Boolean).join(' ') || 'DukaFlow User';
      
      console.log(`🆕 Auto-creating user: ${fullName} (${email})`);
      user = await User.create({
        clerkId,
        fullName,
        email: email || `${clerkId}@clerk.user`,
        avatar: session.imageUrl,
        role: 'admin',
        status: 'online',
        isActive: true,
        isDeleted: false,
      });
      console.log(`✅ User auto-created: ${user._id}`);
    }

    // Attach user context to request
    req.clerkUser = {
      clerkId: session.sub,
      sessionId: session.sid,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName,
      imageUrl: session.imageUrl,
    };

    req.user = user;
    req.userId = user._id;
    req.shopId = user.shop; // May be null if not completed onboarding

    // Auto-recover: if admin user has no shop linked, find it by ownership
    if (!user.shop && user.role === 'admin') {
      try {
        const Shop = require('../models/Shop');
        const shop = await Shop.findOne({ owner: user._id });
        if (shop) {
          user.shop = shop._id;
          await user.save();
          req.shopId = shop._id;
          console.log(`🔗 Auto-linked shop ${shop._id} to user ${user.email}`);
        }
      } catch (err) {
        console.error('⚠️ Auto-link shop error:', err.message);
      }
    }

    // ── Session tracking ──────────────────────────────────────────
    const now = new Date();
    const userAgent = req.headers['user-agent'] || '';
    const browser = userAgent.includes('Firefox') ? 'Firefox'
      : userAgent.includes('Edg') ? 'Edge'
      : userAgent.includes('Chrome') ? 'Chrome'
      : userAgent.includes('Safari') ? 'Safari'
      : 'Unknown';
    const device = userAgent.includes('Mobile') ? 'Mobile'
      : userAgent.includes('Tablet') ? 'Tablet'
      : 'Desktop';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'Unknown';

    // Update lastLogin and merge session
    user.lastLogin = now;
    user.status = 'online';

    // Deduplicate session by sessionId — remove old entry for same session, then push
    user.activeSessions = (user.activeSessions || []).filter(
      (s) => s.sessionId !== session.sid
    );
    user.activeSessions.push({
      sessionId: session.sid,
      device,
      browser,
      ip,
      loginAt: now,
    });

    // Keep max 10 sessions
    if (user.activeSessions.length > 10) {
      user.activeSessions = user.activeSessions.slice(-10);
    }

    await user.save();
    // ── End session tracking ──────────────────────────────────────

    // Proceed to next middleware/route
    next();
  } catch (error) {
    console.error('❌ Clerk authentication error:', error.message);
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
    console.error('   ENV check — CLERK_SECRET_KEY present:', !!process.env.CLERK_SECRET_KEY);
    console.error('   ENV check — MONGODB_URI present:', !!process.env.MONGODB_URI);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Optional Clerk Auth
 * Same as clerkAuth but doesn't fail if token is missing
 * Useful for routes that work for both authenticated and public access
 */
exports.optionalClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without authentication
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Try to verify token
    try {
      const session = await clerk.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const clerkId = session.sub;

      if (clerkId) {
        const User = require('../models/User');
        const user = await User.findOne({ clerkId, isActive: true, isDeleted: false });

        if (user) {
          req.clerkUser = {
            clerkId: session.sub,
            sessionId: session.sid,
            email: session.email,
          };
          req.user = user;
          req.userId = user._id;
          req.shopId = user.shop;
        }
      }
    } catch (error) {
      // Token invalid, but continue without authentication
      console.log('⚠️ Optional auth: Invalid token, continuing as public');
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Shop Ownership Middleware
 * Ensures the authenticated user owns the shop being accessed
 */
exports.requireShopOwnership = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in'
      });
    }

    // Check if user has shop
    if (!req.user.shop) {
      return res.status(403).json({ 
        error: 'Shop not set up',
        message: 'Please complete onboarding first'
      });
    }

    // If shopId param provided, verify ownership
    if (shopId && req.user.shop.toString() !== shopId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have access to this shop'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Shop ownership check error:', error);
    return res.status(500).json({ 
      error: 'Authorization failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Ensures user has required role
 */
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

