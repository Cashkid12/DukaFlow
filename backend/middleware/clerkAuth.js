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
      session = await clerk.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
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
    const user = await User.findOne({ clerkId, isActive: true, isDeleted: false });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'User does not exist in database'
      });
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

    // Proceed to next middleware/route
    next();
  } catch (error) {
    console.error('❌ Clerk authentication error:', error);
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

