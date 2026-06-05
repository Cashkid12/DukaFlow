# DukaFlow — Multi-Tenant SaaS Business Management Platform

> **"Run Your Duka, Smarter."**

A production-ready SaaS platform for small retail businesses in Kenya/East Africa. Manage inventory, record sales, track workers, and get real-time insights — all from one dashboard.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 6, TanStack Query, Recharts, Socket.IO Client, Lucide Icons |
| **Backend** | Node.js, Express 4, MongoDB + Mongoose, Socket.IO, Nodemailer, Node-Cron |
| **Auth** | Clerk (Google/Apple sign-in, session management) |
| **Deployment** | Vercel (frontend), Render/Railway (backend), MongoDB Atlas (database) |

---

## Project Structure

```
dukaflow/
├── frontend/
│   ├── src/
│   │   ├── components/       # ClerkProvider, Skeleton, ReceiptView, etc.
│   │   ├── hooks/            # useCurrentUser, useDashboardQuery, useSocket, etc.
│   │   ├── pages/            # Dashboard, Inventory, Sales, Workers, Settings, etc.
│   │   ├── utils/            # formatters, permissions
│   │   ├── App.jsx           # Routes & layout
│   │   └── index.css         # Tailwind + custom styles
│   └── vite.config.js
│
├── backend/
│   ├── config/               # database.js, mail.js (Ethereal/Gmail)
│   ├── controllers/          # auth, products, sales, workers, dashboard
│   ├── middleware/            # clerkAuth, auth, validation
│   ├── models/               # Shop, User, Product, Sale, Notification
│   ├── routes/               # API route definitions
│   ├── services/             # cronService, dashboardSocket
│   ├── sockets/              # Socket.IO initialization & room management
│   └── index.js              # Express app entry point
│
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Clerk account ([clerk.com](https://clerk.com)) for authentication

### 1. Clone & Install

```bash
git clone https://github.com/Cashkid12/DukaFlow.git
cd DukaFlow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/dukaflow
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Email (auto-creates Ethereal test account in development)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URLs (comma-separated)
CLIENT_URL=http://localhost:5173
```

> **Email testing:** In development, if `EMAIL_USER` is left as placeholder, the app auto-creates an [Ethereal](https://ethereal.email) test account. Sent emails won't be delivered — instead, a **preview URL** is logged to the terminal. Open it in a browser to view the email.

Start the backend:

```bash
npm run dev
```

Backend API: **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

Start the dev server:

```bash
npm run dev
```

Frontend: **http://localhost:5173**

---

## Features

### Dashboard
- Real-time sales, profit, and transaction stats
- Low stock alerts and expiry warnings
- Worker activity overview
- Auto-refresh every 60s + Socket.IO real-time updates

### Inventory Management
- Product CRUD with images, categories, custom attributes
- Stock tracking with low-stock alerts
- CSV import/export
- Filters by category, stock status, search
- Price and stock history per product

### Sales / POS
- Fast point-of-sale interface with product search
- Cart with discounts, payment methods (Cash, M-Pesa, Card)
- Credit sales with customer tracking
- Receipt generation (print + WhatsApp share)
- Transaction history with export

### Worker Management
- Invite workers via email (token-based, 7-day expiry)
- Role-based access: Admin, Manager, Cashier
- Performance tracking (daily, weekly, monthly)
- Active session monitoring & force logout
- Permission management per role

### Reports
- Daily, weekly, monthly sales reports
- Profit & loss statements
- Top products analysis
- Export to CSV

### Settings
- Shop profile & branding
- Multi-branch support
- Custom categories & attributes

---

## Worker Invitation Flow

1. Admin fills "Add Worker" form → clicks "Send Invitation"
2. Backend creates a pending worker in MongoDB with a unique token (7-day expiry)
3. Backend sends a branded HTML email via Nodemailer
4. Worker clicks the link → sees invitation details (shop name, role, inviter)
5. Worker clicks "Accept & Create Account" → Clerk sign-up (Google/Apple)
6. After sign-up, worker is auto-linked to the shop, status changes to "active"
7. Worker appears as "Active" on the Workers page (real-time via Socket.IO)

**Email testing (development):** Uses [Ethereal](https://ethereal.email) — no real emails are sent. Check the terminal for a preview URL after sending.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/auth/me/clerk` | Current user profile (Clerk) |
| `GET` | `/api/auth/onboarding-status` | Check if user has a shop |
| `GET` | `/api/dashboard` | Dashboard stats & metrics |
| `GET` | `/api/products` | List products (with filters) |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/products/stats` | Inventory statistics |
| `POST` | `/api/sales` | Record a sale |
| `GET` | `/api/sales` | List sales/transactions |
| `GET` | `/api/workers` | List workers with performance stats |
| `POST` | `/api/workers/invite` | Invite a new worker (sends email) |
| `GET` | `/api/workers/verify-invitation` | Verify invitation token (public) |
| `POST` | `/api/workers/accept-invitation` | Accept invitation after sign-up |
| `POST` | `/api/workers/:id/resend-invite` | Resend invitation email |
| `DELETE` | `/api/workers/:id/cancel-invite` | Cancel pending invitation |
| `DELETE` | `/api/workers/:id` | Remove worker (soft delete) |
| `GET` | `/api/workers/:id/performance` | Worker chart data |
| `GET` | `/api/workers/:id/transactions` | Worker's recent transactions |
| `GET` | `/api/workers/:id/activity` | Worker activity log |
| `POST` | `/api/auth/workers/:id/force-logout` | Force logout worker sessions |
| `GET` | `/api/shop/me` | Current shop details |
| `PUT` | `/api/shop/me` | Update shop settings |

---

## Real-Time (Socket.IO)

Clients join a shop-specific room (`join:shop <shopId>`) and receive scoped events:

| Event | Trigger | Pages Affected |
|-------|---------|----------------|
| `product:created` | New product added | Inventory, Sales, Dashboard |
| `product:updated` | Product modified | Inventory, Sales, Dashboard |
| `product:deleted` | Product removed | Inventory, Sales, Dashboard |
| `stock:updated` | Stock level changed | Inventory, Sales, Dashboard |
| `sale:completed` | Sale recorded | Sales, Inventory, Dashboard, Workers |
| `worker:invited` | Worker invited | Workers |
| `worker:accepted` | Worker accepted invitation | Workers |
| `worker:cancelled` | Invitation cancelled | Workers |
| `worker:role-changed` | Worker role updated | Workers, WorkerDetail |
| `worker:session-terminated` | Sessions force-logged out | WorkerDetail |
| `worker:removed` | Worker removed | WorkerDetail |
| `dashboard:update` | Stats changed | Dashboard |

---

## Pages & Routes

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing Page | Public |
| `/sign-in` | Sign In (Clerk) | Public |
| `/sign-up` | Sign Up (Clerk) | Public |
| `/accept-invitation` | Worker invitation acceptance | Public |
| `/auth-resolve` | Post-auth redirect handler | Clerk |
| `/onboarding` | Shop setup wizard | Clerk |
| `/dashboard` | Dashboard overview | Clerk |
| `/dashboard/inventory` | Inventory management | Clerk |
| `/dashboard/inventory/add` | Add product | Clerk |
| `/dashboard/inventory/:id` | Product detail | Clerk |
| `/dashboard/sales` | Sales / POS | Clerk |
| `/dashboard/workers` | Worker management | Clerk |
| `/dashboard/workers/:id` | Worker detail & permissions | Clerk |
| `/dashboard/reports` | Reports & analytics | Clerk |
| `/dashboard/settings` | Shop settings | Clerk |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | `#312E81` (Indigo) | Buttons, links, active states |
| **Accent** | `#E8835C` (Terracotta) | CTAs, highlights |
| **Success** | `#10B981` | Positive states, M-Pesa |
| **Warning** | `#F59E0B` | Alerts, pending states |
| **Danger** | `#EF4444` | Errors, destructive actions |

- **Font:** Inter (UI), JetBrains Mono (numbers)
- **Icons:** Lucide React
- **Styling:** Tailwind CSS 4 with `@theme` directive

---

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
npx vercel --prod
```

### Backend (Render / Railway)
1. Push to GitHub
2. Connect repo to Render/Railway
3. Set environment variables in the platform dashboard
4. Deploy — `npm start` is the start command

### Database (MongoDB Atlas)
1. Create a cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Whitelist server IP (or allow all for testing)
3. Copy the connection string to `MONGODB_URI`

---

## Environment Variables Summary

### Backend `.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `NODE_ENV` | `development` or `production` | Yes |
| `CLERK_SECRET_KEY` | Clerk API secret key | Yes |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | Yes |
| `EMAIL_HOST` | SMTP host | Dev: auto (Ethereal) |
| `EMAIL_PORT` | SMTP port | Dev: auto (Ethereal) |
| `EMAIL_USER` | SMTP username | Dev: optional |
| `EMAIL_PASS` | SMTP password | Dev: optional |
| `CLIENT_URL` | Allowed frontend origins (comma-separated) | Yes |

### Frontend `.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |
| `VITE_SOCKET_URL` | Socket.IO server URL | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |

---

## License

Proprietary. All rights reserved.

---

**Built with care for Kenyan dukas.**
