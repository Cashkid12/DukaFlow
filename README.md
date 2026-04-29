# 🎉 DUKAFLOW - Multi-Tenant SaaS Business Management Platform

**Tagline:** "Run Your Duka, Smarter."

A complete, production-ready SaaS platform built for small retail businesses in Kenya/East Africa.

---

## 📁 PROJECT STRUCTURE

```
dukaflow/
├── frontend/              # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── context/       # React Context providers
│   ├── public/            # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Node.js + Express Backend API
│   ├── config/            # Database, auth, email configs
│   ├── models/            # Mongoose schemas
│   ├── controllers/       # Route controllers
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, validation middleware
│   ├── services/          # Business logic services
│   ├── jobs/              # Cron jobs (6 automated tasks)
│   ├── sockets/           # Socket.io real-time setup
│   ├── utils/             # Helper utilities
│   └── package.json
│
└── README.md              # This file
```

---

## 🚀 QUICK START

### Prerequisites
- Node.js 18+ installed
- MongoDB installed or MongoDB Atlas account
- npm or yarn package manager

### 1️⃣ Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### 2️⃣ Setup Backend

Open a new terminal:

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `.env` file with your MongoDB connection string:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dukaflow
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

Backend API will be available at: **http://localhost:5000**

---

## 🎨 FEATURES

### ✅ Frontend Features
- **Landing Page** - Conversion-optimized with animations
- **Authentication** - Sign In & Multi-step Sign Up
- **Dashboard** - Real-time stats, charts, alerts
- **Inventory Management** - Product CRUD, filters, search
- **Sales/POS** - Point of Sale interface, transaction history
- **Worker Management** - Team management, performance tracking
- **Reports** - Daily, weekly, monthly analytics
- **Settings** - Shop profile, billing, multi-branch
- **Super Admin Panel** - Platform management

### ✅ Backend Features
- **RESTful API** - Complete CRUD operations
- **JWT Authentication** - Secure token-based auth
- **Multi-Tenancy** - Shop-based data isolation
- **6 Automated Cron Jobs:**
  - Daily Reports (9:00 PM EAT)
  - Weekly Reports (Monday 8:00 AM EAT)
  - Monthly P&L (1st of month 8:00 AM EAT)
  - Low Stock Checks (Every 2 hours)
  - Expiry Alerts (Daily 8:00 AM EAT)
  - Trial Expiry (Daily midnight)
- **Real-Time Updates** - Socket.io integration
- **Email Notifications** - Automated reports & alerts

---

## 🛠️ TECH STACK

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Socket.io** - Real-time server
- **Node-Cron** - Scheduled tasks
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

---

## 📊 DATABASE SCHEMAS

### Shop
- Business profile, settings, subscription
- Multi-branch support
- Custom categories & attributes

### User
- Authentication, roles, permissions
- Active session tracking
- Worker management

### Product
- Inventory tracking
- Stock alerts, expiry dates
- Custom attributes (size, color, etc.)

### Sale/Transaction
- POS transactions
- Payment methods (Cash, M-Pesa, Card)
- Profit calculations

### Notification
- Real-time alerts
- Email notifications
- User preferences

---

## 🎯 KEY FEATURES

### Multi-Tenancy Architecture
- Each shop gets isolated data
- Shop-specific rooms for real-time updates
- Subdomain routing ready (`[shop].dukaflow.com`)

### Real-Time Features
- Live stock updates
- Instant sale notifications
- Worker activity tracking
- Alert system

### Automated Reporting
- Daily sales summaries via email
- Weekly performance insights
- Monthly P&L statements
- Smart alerts (low stock, expiry)

### Security
- JWT authentication with HTTP-only cookies
- Password hashing (bcrypt)
- Session management
- Role-based access control

---

## 📱 PAGES & ROUTES

### Public Routes
- `/` - Landing page
- `/signin` - Login
- `/signup` - Multi-step registration

### Dashboard Routes
- `/dashboard` - Overview
- `/dashboard/inventory` - Product management
- `/dashboard/sales` - Sales & POS
- `/dashboard/workers` - Team management
- `/dashboard/reports` - Analytics
- `/dashboard/settings` - Configuration

### Admin Routes
- `/admin` - Super admin panel

---

## 🔧 CONFIGURATION

### Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dukaflow
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

---

## 🚀 DEPLOYMENT

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway/Render)
```bash
cd backend
# Set environment variables in dashboard
npm start
```

### Database (MongoDB Atlas)
1. Create cluster at mongodb.com/cloud/atlas
2. Whitelist server IP
3. Get connection string
4. Update `MONGODB_URI` in backend `.env`

---

## 📚 DOCUMENTATION

- **[Complete Implementation Guide](COMPLETE_IMPLEMENTATION.md)** - Full technical details
- **[Deployment Guide](DEPLOYMENT.md)** - Production setup
- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes
- **[Auth Pages Improvements](AUTH_PAGES_IMPROVEMENTS.md)** - Design updates

---

## 🎨 DESIGN SYSTEM

### Colors
- **Primary:** Indigo (#312E81)
- **Accent:** Terracotta (#E8835C)
- **Success:** Green (#10B981)
- **Warning:** Amber (#F59E0B)
- **Danger:** Red (#EF4444)
- **M-Pesa:** Green (#43B02A)

### Typography
- **Font:** Inter (sans-serif)
- **Numbers:** JetBrains Mono (monospace)

### Components
- Buttons, Cards, Badges, Forms
- Modal, Drawer, Switch
- Navigation (Sidebar, TopBar, MobileNav)

---

## 🧪 TESTING

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Run Backend Tests
```bash
cd backend
npm test
```

---

## 🤝 CONTRIBUTING

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 LICENSE

This project is proprietary software. All rights reserved.

---

## 📞 SUPPORT

- **Email:** support@dukaflow.com
- **Documentation:** [Complete Implementation Guide](COMPLETE_IMPLEMENTATION.md)
- **Issues:** GitHub Issues

---

## 🎉 CREDITS

Built with ❤️ for Kenyan Dukas

**Run Your Duka, Smarter.**

---

## 📊 PROJECT STATUS

✅ **COMPLETE** - Production Ready

- 11 Pages implemented
- 6 Automated cron jobs
- Real-time Socket.io integration
- Complete API layer
- Multi-tenant architecture
- Deployment configurations

**Last Updated:** April 8, 2026
