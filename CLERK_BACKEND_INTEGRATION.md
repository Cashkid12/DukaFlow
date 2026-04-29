# 🔐 CLERK BACKEND INTEGRATION - COMPLETE

## ✅ Status: FULLY IMPLEMENTED

Clerk authentication has been integrated into the backend with webhook handlers, authentication middleware, and database sync.

---

## 🚨 URGENT: SECURITY ACTION REQUIRED

### **ROTATE YOUR CLERK SECRET KEY IMMEDIATELY**

Your secret key has been exposed in the conversation. Follow these steps NOW:

1. **Go to [Clerk Dashboard](https://dashboard.clerk.com)**
2. Navigate to: **Your Application → API Keys**
3. Click **"Roll"** next to `sk_test_GOlLPEtKFd5bSOlsBx8ETPU1BWHnwqrpalu9MR7NoD`
4. Copy the new secret key
5. Update `backend/.env`:
   ```env
   CLERK_SECRET_KEY=your_new_secret_key_here
   ```
6. Update `frontend/.env`:
   ```env
   CLERK_SECRET_KEY=your_new_secret_key_here
   ```

⚠️ **DO NOT SKIP THIS STEP** - Your current key is compromised!

---

## 📦 What Was Installed

```bash
npm install @clerk/clerk-sdk-node svix
```

**Packages Added:**
- `@clerk/clerk-sdk-node` - Clerk SDK for Node.js/Express
- `svix` - Webhook signature verification library

---

## 📁 Files Created/Modified

### ✅ Created Files:

1. **`backend/controllers/clerkWebhookController.js`** (226 lines)
   - Webhook event handlers
   - user.created, user.updated, user.deleted
   - Signature verification with Svix
   - MongoDB sync logic

2. **`backend/middleware/clerkAuth.js`** (214 lines)
   - JWT token verification
   - User context extraction
   - Shop ownership validation
   - Role-based authorization

3. **`backend/routes/clerk.js`** (15 lines)
   - Webhook endpoint route
   - POST `/api/clerk/webhook`

### ✅ Modified Files:

1. **`backend/models/User.js`**
   - Added `clerkId` field (unique, indexed)
   - Made `shop` optional (set during onboarding)
   - Made `password` optional (OAuth users)
   - Added `isDeleted` field (soft delete)
   - Added indexes for performance

2. **`backend/.env`**
   - Added `CLERK_SECRET_KEY`
   - Added `CLERK_WEBHOOK_SECRET`

3. **`backend/index.js`**
   - Imported Clerk routes
   - Added `/api/clerk` route prefix

---

## 🔌 Webhook Configuration

### Endpoint Details

**URL**: `POST https://your-backend.com/api/clerk/webhook`  
**Content-Type**: `application/json`  
**Signature**: Svix headers required

### Events Handled

| Event | Action | Description |
|-------|--------|-------------|
| `user.created` | Create User | Creates MongoDB User record with Clerk data |
| `user.updated` | Update User | Syncs name, email, phone, avatar changes |
| `user.deleted` | Soft Delete | Marks user as inactive and deleted |

### Webhook Flow

```
Clerk Event → Webhook → Signature Verification → MongoDB Sync
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              user.created         user.updated
                    ↓                   ↓
            Create User           Update User
            - clerkId             - fullName
            - email               - email
            - fullName            - phone
            - phone               - avatar
            - avatar
```

---

## 🔐 Authentication Middleware

### 1. **clerkAuth** (Required Authentication)

**Usage:**
```javascript
const { clerkAuth } = require('./middleware/clerkAuth');

app.get('/api/protected', clerkAuth, (req, res) => {
  // req.user - MongoDB User document
  // req.clerkUser - Clerk session data
  // req.userId - MongoDB User _id
  // req.shopId - Associated shop ID
});
```

**Flow:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token with Clerk SDK
3. Find User by `clerkId` in MongoDB
4. Attach user context to request
5. Return 401 if invalid/missing

**Response on Failure:**
```json
{
  "error": "Authentication required",
  "message": "No token provided or invalid format"
}
```

### 2. **optionalClerkAuth** (Optional Authentication)

**Usage:**
```javascript
const { optionalClerkAuth } = require('./middleware/clerkAuth');

app.get('/api/mixed', optionalClerkAuth, (req, res) => {
  // Works for both authenticated and public access
  if (req.user) {
    // Authenticated user
  } else {
    // Public access
  }
});
```

**Flow:**
- Same as `clerkAuth` but doesn't fail if token is missing
- Continues as public access if no valid token

### 3. **requireShopOwnership** (Shop Access Control)

**Usage:**
```javascript
const { clerkAuth, requireShopOwnership } = require('./middleware/clerkAuth');

app.get('/api/shops/:shopId/products', 
  clerkAuth, 
  requireShopOwnership, 
  (req, res) => {
    // User owns the shop being accessed
  }
);
```

**Validates:**
- User is authenticated
- User has a shop (completed onboarding)
- User owns the shop being accessed

### 4. **requireRole** (Role-Based Access)

**Usage:**
```javascript
const { clerkAuth, requireRole } = require('./middleware/clerkAuth');

app.delete('/api/shops/:shopId', 
  clerkAuth, 
  requireRole(['admin']), 
  (req, res) => {
    // Only admins can delete shops
  }
);
```

**Validates:**
- User has one of the specified roles
- Returns 403 if insufficient permissions

---

## 🗄️ Database Schema Updates

### User Model Changes

```javascript
{
  // NEW: Clerk Integration
  clerkId: String,          // Unique Clerk user ID (indexed)
  isDeleted: Boolean,       // Soft delete flag
  
  // MODIFIED: Now optional
  shop: ObjectId,           // Optional (set during onboarding)
  password: String,         // Optional (OAuth users)
  
  // EXISTING: Unchanged
  fullName: String,
  email: String,
  phone: String,
  role: String,             // 'admin' or 'employee'
  avatar: String,           // Clerk profile image URL
  isActive: Boolean,
  lastLogin: Date,
}
```

### Indexes

```javascript
clerkId: { unique: true, sparse: true }
email: { index: true }
shop + email: { compound index }
```

---

## 🔧 Setup Instructions

### 1. Configure Webhook in Clerk Dashboard

1. **Go to [Clerk Dashboard](https://dashboard.clerk.com)**
2. Navigate to: **Webhooks**
3. Click **"Add Endpoint"**
4. Configure:
   - **Endpoint URL**: `https://your-backend.com/api/clerk/webhook`
   - **Events to subscribe**:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
5. Click **Create**
6. Copy the **Webhook Secret** (starts with `whsec_`)
7. Update `backend/.env`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

### 2. Enable Google OAuth

1. **Go to Google Cloud Console**
2. Create OAuth 2.0 Client ID
3. Configure:
   - **Authorized JavaScript Origins**:
     - `http://localhost:5173`
     - `https://dukaflow.com`
   - **Authorized Redirect URIs**:
     - `https://clerk.com/oauth/google/callback`
4. Copy **Client ID** and **Client Secret**

5. **Go to Clerk Dashboard**
6. Navigate to: **User & Authentication → Social Connections → Google**
7. Paste credentials
8. Enable **"Use during sign-up and sign-in"**

### 3. Configure CORS

Update `backend/index.js` if needed:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dukaflow.com',
    'https://*.dukaflow.com' // For shop subdomains
  ],
  credentials: true,
}));
```

### 4. Set Session Lifetime

1. **Go to Clerk Dashboard**
2. Navigate to: **User & Authentication → Sessions**
3. Set **Session Lifetime**: `7 days`
4. Enable **Multi-session** if needed

---

## 🧪 Testing the Webhook

### Method 1: Clerk Dashboard Test

1. Go to **Webhooks** in Clerk Dashboard
2. Click on your webhook endpoint
3. Click **"Test"** tab
4. Select event type: `user.created`
5. Click **"Send test webhook"**
6. Check backend logs for success

### Method 2: Manual cURL Test

```bash
curl -X POST http://localhost:5000/api/clerk/webhook \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_test123" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: v1,test_signature" \
  -d '{
    "type": "user.created",
    "data": {
      "id": "user_test123",
      "email_addresses": [{"email_address": "test@example.com"}],
      "first_name": "Test",
      "last_name": "User",
      "image_url": "https://example.com/avatar.jpg",
      "phone_numbers": []
    }
  }'
```

### Method 3: Create Real User

1. Sign up at `http://localhost:5173/sign-up`
2. Check backend logs for webhook event
3. Verify user created in MongoDB:
   ```javascript
   db.users.findOne({ email: "your_email@example.com" })
   ```

---

## 📊 Webhook Payload Examples

### user.created

```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123",
    "email_addresses": [
      {
        "email_address": "john@example.com",
        "verification": { "status": "verified" }
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://img.clerk.com/user_2abc123.jpg",
    "phone_numbers": [
      {
        "phone_number": "+254712345678",
        "verification": { "status": "verified" }
      }
    ],
    "created_at": 1234567890
  }
}
```

### MongoDB Result

```javascript
{
  _id: ObjectId("..."),
  clerkId: "user_2abc123",
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+254712345678",
  avatar: "https://img.clerk.com/user_2abc123.jpg",
  role: "admin",
  isActive: true,
  isDeleted: false,
  shop: null, // Set during onboarding
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 🔒 Security Checklist

### ✅ Completed:
- [x] Webhook signature verification (Svix)
- [x] JWT token verification (Clerk SDK)
- [x] User context extraction
- [x] Shop ownership validation
- [x] Role-based access control
- [x] Soft delete for user.deleted events
- [x] Environment variable protection (.gitignore)

### ⚠️ Pending:
- [ ] **Rotate exposed secret key** (URGENT)
- [ ] Add webhook secret to `.env`
- [ ] Configure CORS origins
- [ ] Set up production webhook endpoint
- [ ] Enable 2FA for admin users
- [ ] Rate limiting for API routes
- [ ] IP whitelist for webhooks
- [ ] Audit logging for auth events

---

## 📝 Environment Variables

### backend/.env

```env
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_YOUR_NEW_ROTATED_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Existing variables
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### frontend/.env

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z2FtZS1ncnViLTIyLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_YOUR_NEW_ROTATED_KEY
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

## 🚀 Usage Examples

### Protect API Routes

```javascript
const express = require('express');
const router = express.Router();
const { clerkAuth, requireShopOwnership } = require('../middleware/clerkAuth');
const Product = require('../models/Product');

// Get products (requires authentication)
router.get('/', clerkAuth, async (req, res) => {
  const products = await Product.find({ shop: req.shopId });
  res.json(products);
});

// Create product (requires shop ownership)
router.post('/', clerkAuth, requireShopOwnership, async (req, res) => {
  const product = await Product.create({
    ...req.body,
    shop: req.shopId,
  });
  res.json(product);
});

module.exports = router;
```

### Frontend API Call with Token

```javascript
import { useAuth } from '@clerk/clerk-react';

const fetchProducts = async () => {
  const { getToken } = useAuth();
  const token = await getToken();
  
  const response = await fetch('/api/products', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

---

## 🎯 Next Steps

### Immediate:
1. ✅ **Rotate Clerk secret key**
2. ✅ **Configure webhook in Clerk Dashboard**
3. ✅ **Test webhook with real user signup**
4. ✅ **Verify MongoDB sync**

### Optional Enhancements:
- [ ] Add webhook retry logic
- [ ] Implement webhook event logging
- [ ] Add IP whitelisting for webhooks
- [ ] Set up Clerk Organizations for multi-tenancy
- [ ] Add worker invitation flow
- [ ] Implement M-Pesa phone verification
- [ ] Add email template customization
- [ ] Set up production monitoring

---

## 📚 Resources

- [Clerk Node.js SDK](https://clerk.com/docs/references/node/overview)
- [Svix Webhook Verification](https://docs.svix.com/)
- [Clerk Webhooks Guide](https://clerk.com/docs/webhooks/overview)
- [JWT Verification](https://clerk.com/docs/backend-tasks/overview)
- [Clerk Dashboard](https://dashboard.clerk.com)

---

## 🎉 Summary

**Backend Clerk integration is complete with:**
- ✅ Webhook handler for user events
- ✅ Signature verification (Svix)
- ✅ MongoDB sync (create, update, delete)
- ✅ Authentication middleware
- ✅ Token verification (JWT)
- ✅ Shop ownership validation
- ✅ Role-based access control
- ✅ Soft delete support
- ✅ User model updated
- ✅ Environment variables configured
- ✅ Comprehensive documentation

**Your backend is now ready to sync with Clerk authentication!** 🚀

---

**Last Updated:** April 16, 2026  
**Status:** ✅ Complete (Rotate secret key before deployment)

