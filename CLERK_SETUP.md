# Clerk Authentication Integration Guide

## ✅ Environment Variables Added

Your Clerk keys have been added to `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z2FtZS1ncnViLTIyLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_GOlLPEtKFd5bSOlsBx8ETPU1BWHnwqrpalu9MR7NoD
```

---

## 📦 Step 1: Install Clerk Dependencies

Run this command in your frontend directory:

```bash
cd frontend
npm install @clerk/clerk-react
```

---

## 🔧 Step 2: Create Clerk Provider

Create a new file: `frontend/src/components/ClerkProvider.jsx`

```jsx
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export const ClerkAuthProvider = ({ children }) => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
};
```

---

## 🎯 Step 3: Wrap Your App

Update `frontend/src/main.jsx`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkAuthProvider } from './components/ClerkProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkAuthProvider>
      <App />
    </ClerkAuthProvider>
  </StrictMode>,
);
```

---

## 🚀 Step 4: Add Authentication to Routes

Update `frontend/src/App.jsx`:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminPanel from './pages/SuperAdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Super Admin Panel */}
        <Route path="/admin" element={<SuperAdminPanel />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <SignedIn>
              <DashboardLayout />
            </SignedIn>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="workers" element={<div className="p-6"><h1 className="h2">Workers Management</h1><p className="text-neutral-600 mt-2">Coming soon...</p></div>} />
          <Route path="reports" element={<div className="p-6"><h1 className="h2">Reports</h1><p className="text-neutral-600 mt-2">Coming soon...</p></div>} />
          <Route path="notifications" element={<div className="p-6"><h1 className="h2">Notifications</h1><p className="text-neutral-600 mt-2">Coming soon...</p></div>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect to sign-in if not authenticated */}
        <Route
          path="/dashboard/*"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 👤 Step 5: Use Clerk Components

### Example: User Button in Header

Update `frontend/src/components/Navigation.jsx`:

```jsx
import { UserButton, useUser } from '@clerk/clerk-react';

// Inside your Header component:
export const Header = () => {
  const { isSignedIn, user } = useUser();

  return (
    <header>
      {/* ... existing code ... */}
      
      <div className="hidden lg:flex items-center gap-4">
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <>
            <Link to="/signin">
              <Button variant="ghost" className="py-2 px-5">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" className="py-2 px-5">Start Free Trial</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
```

---

### Example: Display User Info

```jsx
import { useUser } from '@clerk/clerk-react';

const UserProfile = () => {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return null;
  }

  return (
    <div>
      <h2>Welcome, {user.firstName} {user.lastName}!</h2>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
};
```

---

### Example: Custom Sign-In Page

Replace your existing `SignIn.jsx` with Clerk's component:

```jsx
import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <SignIn 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          }
        }}
      />
    </div>
  );
};

export default SignInPage;
```

---

### Example: Custom Sign-Up Page

Replace your existing `SignUp.jsx`:

```jsx
import { SignUp } from '@clerk/clerk-react';

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <SignUp 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          }
        }}
      />
    </div>
  );
};

export default SignUpPage;
```

---

## 🔐 Step 6: Protect API Routes (Backend)

For backend integration, you'll need to verify Clerk tokens. Install Clerk in backend:

```bash
cd backend
npm install @clerk/clerk-sdk-node
```

Create middleware: `backend/middleware/clerkAuth.js`

```javascript
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Require authentication
const requireAuth = ClerkExpressRequireAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
});

module.exports = requireAuth;
```

Use in routes:

```javascript
const requireAuth = require('../middleware/clerkAuth');

router.get('/protected', requireAuth, (req, res) => {
  const userId = req.auth.userId;
  // Access authenticated user data
  res.json({ message: 'Protected data', userId });
});
```

---

## 🎨 Step 7: Customize Clerk Appearance

Add to your `index.css`:

```css
/* Clerk Custom Styles */
.cl-formButtonPrimary {
  --clerk-color: #312E81 !important;
}

.cl-card {
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

.cl-headerTitle {
  color: #111827 !important;
}
```

---

## 📋 Clerk Hooks Reference

```jsx
import { 
  useUser,           // Current user data
  useAuth,           // Authentication state
  useSignIn,         // Sign-in controls
  useSignUp,         // Sign-up controls
  useClerk,          // Full Clerk object
} from '@clerk/clerk-react';

// Example usage:
const { user, isLoaded, isSignedIn } = useUser();
const { getToken, signOut } = useAuth();
```

---

## 🔒 Security Notes

✅ **NEVER** commit `.env` to version control  
✅ `VITE_CLERK_PUBLISHABLE_KEY` is safe for frontend (starts with `pk_test_`)  
✅ `CLERK_SECRET_KEY` should **ONLY** be used in backend (starts with `sk_test_`)  
✅ Keep your secret key confidential  
✅ Rotate keys if exposed  

---

## 🧪 Testing

1. Start your frontend: `npm run dev`
2. Navigate to `/signin` or `/signup`
3. Create a test account
4. Verify user appears in Clerk Dashboard

---

## 📚 Resources

- [Clerk React Docs](https://clerk.com/docs/references/react/overview)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [React Integration Guide](https://clerk.com/docs/quickstarts/react)
- [Customization Guide](https://clerk.com/docs/customization/overview)

---

## 🚨 Troubleshooting

### "Missing Publishable Key" Error
- Ensure `.env` file exists in `frontend/` directory
- Restart dev server after adding `.env`
- Verify key starts with `pk_test_` or `pk_live_`

### Components Not Rendering
- Check that `ClerkProvider` wraps your entire app
- Verify import paths are correct
- Check browser console for errors

### Sign-In Not Working
- Verify Clerk dashboard has correct redirect URLs
- Check that test keys are being used (not production)
- Ensure email verification is configured in Clerk dashboard

---

**Last Updated**: April 16, 2026  
**Clerk SDK Version**: Latest  
**Status**: ✅ Ready to Install
