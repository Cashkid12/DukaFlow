const { Webhook } = require('svix');
const User = require('../models/User');
const Shop = require('../models/Shop');

/**
 * Clerk Webhook Handler
 * Syncs Clerk user events with MongoDB database
 * 
 * Events handled:
 * - user.created
 * - user.updated
 * - user.deleted
 */
exports.handleClerkWebhook = async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('❌ CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing Svix headers' });
    }

    // Get raw body
    const payload = JSON.stringify(req.body);
    const headers = {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    };

    // Verify webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process event
    const eventType = evt.type;
    const userData = evt.data;

    console.log(`📨 Clerk Webhook Event: ${eventType}`);
    console.log(`👤 Clerk User ID: ${userData.id}`);

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(userData);
        break;

      case 'user.updated':
        await handleUserUpdated(userData);
        break;

      case 'user.deleted':
        await handleUserDeleted(userData);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handle user.created event
 * Creates User record in MongoDB
 */
async function handleUserCreated(userData) {
  try {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
      phone_numbers,
    } = userData;

    const email = email_addresses?.[0]?.email_address;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();
    const phone = phone_numbers?.[0]?.phone_number;

    if (!email) {
      console.error('❌ No email found in Clerk user data');
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ clerkId }, { email }],
    });

    if (existingUser) {
      console.log(`⚠️ User already exists: ${email}`);
      // Update existing user with Clerk data
      existingUser.clerkId = clerkId;
      existingUser.fullName = fullName || existingUser.fullName;
      existingUser.avatar = image_url || existingUser.avatar;
      existingUser.phone = phone || existingUser.phone;
      existingUser.isActive = true;
      existingUser.isDeleted = false;
      await existingUser.save();
      console.log(`✅ User updated: ${email}`);
      return;
    }

    // Create new user
    const newUser = await User.create({
      clerkId,
      fullName: fullName || 'DukaFlow User',
      email,
      phone,
      avatar: image_url,
      role: 'admin', // Default role for new signups
      isActive: true,
      isDeleted: false,
    });

    console.log(`✅ User created: ${email} (ID: ${newUser._id})`);

    // Note: Shop creation happens during onboarding, not here
    // The onboarding flow will link the shop to this user
  } catch (error) {
    console.error('❌ Error handling user.created:', error);
    throw error;
  }
}

/**
 * Handle user.updated event
 * Updates User record in MongoDB
 */
async function handleUserUpdated(userData) {
  try {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
      phone_numbers,
    } = userData;

    const email = email_addresses?.[0]?.email_address;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();
    const phone = phone_numbers?.[0]?.phone_number;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });

    if (!user) {
      console.warn(`⚠️ User not found for update: ${clerkId}`);
      // Create user if doesn't exist
      await handleUserCreated(userData);
      return;
    }

    // Update user fields
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;
    if (image_url) user.avatar = image_url;
    if (phone) user.phone = phone;

    await user.save();
    console.log(`✅ User updated: ${email || user.email}`);
  } catch (error) {
    console.error('❌ Error handling user.updated:', error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 * Soft deletes or anonymizes User record
 */
async function handleUserDeleted(userData) {
  try {
    const { id: clerkId, email_addresses } = userData;
    const email = email_addresses?.[0]?.email_address;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });

    if (!user) {
      console.warn(`⚠️ User not found for deletion: ${clerkId}`);
      return;
    }

    // Soft delete - mark as inactive and deleted
    user.isActive = false;
    user.isDeleted = true;
    
    // Optionally anonymize data
    // user.fullName = 'Deleted User';
    // user.email = `deleted_${user._id}@dukaflow.local`;
    
    await user.save();
    console.log(`✅ User soft-deleted: ${email || user.email}`);

    // Note: Shop data is preserved for compliance
    // You may want to transfer ownership or notify other members
  } catch (error) {
    console.error('❌ Error handling user.deleted:', error);
    throw error;
  }
}

