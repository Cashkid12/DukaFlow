# 🚀 DUKAFLOW - SETUP GUIDE

## 📁 NEW PROJECT STRUCTURE

The project is now organized into two main folders:

```
dukaflow/
├── frontend/    ← React + Vite application
├── backend/     ← Node.js + Express API
└── README.md    ← Project documentation
```

---

## ⚡ QUICK START (5 Minutes)

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 2: Start Frontend Development Server

```bash
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

### Step 3: Install Backend Dependencies

Open a **NEW terminal**:

```bash
cd backend
npm install
```

### Step 4: Configure Backend Environment

Create `.env` file in the `backend/` folder:

```bash
# Copy the example file
cp .env.example .env
```

Edit `backend/.env` and update:

```env
MONGODB_URI=mongodb://localhost:27017/dukaflow
JWT_SECRET=my_secret_key_12345
```

### Step 5: Start Backend Server

```bash
npm run dev
```

✅ Backend running at: **http://localhost:5000**

---

## 🎯 WHAT YOU CAN DO NOW

### Without Backend (Frontend Only):
✅ View the beautiful landing page  
✅ Navigate to Sign In / Sign Up pages  
✅ See dashboard UI (with mock data)  
✅ Browse inventory & sales pages  

### With Backend (Full Functionality):
✅ Register new account  
✅ Login with credentials  
✅ Real-time data from database  
✅ Automated cron jobs running  
✅ Socket.io real-time updates  

---

## 📦 FOLDER DETAILS

### `frontend/` Folder
Contains all React application files:

```
frontend/
├── src/
│   ├── components/    # UI components (Button, Cards, Forms, etc.)
│   ├── pages/         # Page components (Landing, Dashboard, etc.)
│   ├── services/      # API calls (axios setup)
│   ├── hooks/         # Custom hooks (useSocket)
│   ├── utils/         # Helpers (formatters, validators)
│   └── context/       # React Context (TODO)
├── public/            # Static assets
├── package.json       # Dependencies
└── vite.config.js     # Vite configuration
```

**Commands:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

### `backend/` Folder
Contains all Node.js/Express API files:

```
backend/
├── config/        # Database, auth, email configs
├── models/        # MongoDB schemas (Shop, User, Product, etc.)
├── controllers/   # Route handlers
├── routes/        # API endpoints
├── middleware/    # Auth, validation
├── services/      # Cron job scheduler
├── jobs/          # 6 automated cron jobs
├── sockets/       # Socket.io setup
├── utils/         # Token generation
├── package.json   # Dependencies
└── index.js       # Main server file
```

**Commands:**
```bash
npm run dev      # Start with nodemon (auto-restart)
npm start        # Start production server
```

---

## 🔧 COMMON TASKS

### Update Frontend Dependencies
```bash
cd frontend
npm install <package-name>
```

### Update Backend Dependencies
```bash
cd backend
npm install <package-name>
```

### Run Both Servers

**Terminal 1 (Frontend):**
```bash
cd frontend
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd backend
npm run dev
```

---

## 🐛 TROUBLESHOOTING

### Frontend Won't Start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Can't Connect to MongoDB
1. Check if MongoDB is running: `mongod`
2. Verify `MONGODB_URI` in `backend/.env`
3. Try: `mongodb://127.0.0.1:27017/dukaflow`

### Port Already in Use
**Frontend (5173):**
```bash
# Vite will automatically use next available port
```

**Backend (5000):**
Update `PORT=5001` in `backend/.env`

---

## 📊 CRON JOBS (Auto-Running)

When backend starts, these jobs run automatically:

| Job | Schedule | Action |
|-----|----------|--------|
| Daily Report | 9:00 PM EAT | Email sales summary |
| Weekly Report | Monday 8:00 AM | Email weekly insights |
| Monthly P&L | 1st of month | Email profit/loss |
| Low Stock Check | Every 2 hours | Create alerts |
| Expiry Check | 8:00 AM daily | Expiry warnings |
| Trial Expiry | Midnight | Suspend expired trials |

You'll see this in backend console:
```
🕐 Initializing Cron Jobs...
  ✅ Daily Report scheduled (9:00 PM EAT)
  ✅ Weekly Report scheduled (Monday 8:00 AM EAT)
  ✅ Monthly P&L Report scheduled (1st of month 8:00 AM EAT)
  ✅ Low Stock Check scheduled (Every 2 hours)
  ✅ Expiry Check scheduled (Daily 8:00 AM EAT)
  ✅ Trial Expiry Check scheduled (Daily midnight)
🎉 All Cron Jobs Initialized Successfully
```

---

## 🌐 API ENDPOINTS

Backend provides these API routes:

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete

### Sales
- `GET /api/transactions` - List sales
- `POST /api/transactions` - Create sale

### More endpoints in development...

---

## 🎨 DESIGN SYSTEM

### Colors
- **Primary:** `#312E81` (Indigo)
- **Accent:** `#E8835C` (Terracotta)
- **Success:** `#10B981`
- **Warning:** `#F59E0B`
- **Danger:** `#EF4444`

### Typography
- **Font:** Inter
- **Numbers:** JetBrains Mono

### Components
All components in `frontend/src/components/`:
- Button, Cards, Badge, Forms
- Modal, Drawer, Switch
- Navigation components

---

## 📚 NEXT STEPS

1. ✅ **Project organized** - Frontend & Backend separated
2. ✅ **Dependencies ready** - Install with `npm install`
3. 🎨 **Enhance landing page** - Add animations & micro-interactions
4. 🔌 **Connect frontend to backend** - Wire up API calls
5. 🧪 **Add tests** - Unit & integration tests
6. 🚀 **Deploy** - Vercel (frontend) + Railway (backend)

---

## 💡 TIPS

### Development Workflow
1. Open **two terminals**
2. Terminal 1: `cd frontend && npm run dev`
3. Terminal 2: `cd backend && npm run dev`
4. Make changes → Auto-reload!

### Hot Reload
- **Frontend:** Vite HMR (instant updates)
- **Backend:** Nodemon (auto-restart on file changes)

### Environment Variables
- Frontend: `frontend/.env` (prefix with `VITE_`)
- Backend: `backend/.env` (no prefix needed)

---

## 🆘 NEED HELP?

- **Documentation:** [README.md](README.md)
- **Complete Guide:** [COMPLETE_IMPLEMENTATION.md](COMPLETE_IMPLEMENTATION.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Happy Coding! 🎉**

*Run Your Duka, Smarter.*
