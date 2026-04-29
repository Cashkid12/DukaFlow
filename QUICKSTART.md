# DukaFlow - Quick Start Guide

## 🎯 Getting Started in 5 Minutes

### Step 1: Install Frontend Dependencies
```bash
npm install
```

### Step 2: Start Frontend Development Server
```bash
npm run dev
```

The app will automatically open at `http://localhost:5173`

### Step 3: Set Up Backend (Optional - for full functionality)

Open a new terminal:

```bash
cd server
npm install
```

### Step 4: Configure Backend Environment

Create a `.env` file in the `server/` folder:

```bash
# Copy the example file
cp .env.example .env
```

Update the `.env` file with your MongoDB connection string:
```env
MONGODB_URI=mongodb://localhost:27017/dukaflow
JWT_SECRET=my_super_secret_key_12345
```

### Step 5: Start Backend Server

```bash
npm run dev
```

Backend API will be available at `http://localhost:5000`

## 📱 What You Can Do Right Now

### Without Backend (Frontend Only):
✅ View the beautiful landing page
✅ Navigate through all pages
✅ See the dashboard with sample data
✅ Test inventory management UI
✅ Explore sales tracking interface
✅ Experience responsive design on mobile

### With Backend (Full Stack):
✅ Register a new account
✅ Sign in with credentials
✅ Real authentication with JWT
✅ Protected dashboard routes
✅ API integration ready

## 🎨 Pages Available

### Public Pages:
- `/` - Landing page with all sections
- `/signin` - Sign in page
- `/signup` - Registration page

### Dashboard Pages (Protected):
- `/dashboard` - Overview with charts and stats
- `/dashboard/inventory` - Product management
- `/dashboard/sales` - Sales tracking
- `/dashboard/workers` - Worker management (placeholder)
- `/dashboard/reports` - Reports (placeholder)
- `/dashboard/settings` - Settings (placeholder)

## 🎯 Key Features Implemented

### Frontend:
✅ Complete design system with Indigo & Terracotta colors
✅ Responsive layout (mobile, tablet, desktop)
✅ Reusable component library
✅ Beautiful charts with Recharts
✅ Grid and list views for inventory
✅ Search and filter functionality
✅ Mobile navigation bar
✅ Professional landing page

### Backend:
✅ Express.js server setup
✅ MongoDB models (User, Shop, Product, Sale)
✅ JWT authentication
✅ Password hashing with bcrypt
✅ Protected routes
✅ Socket.io for real-time updates
✅ CORS configuration
✅ Cookie-based authentication

## 🐛 Troubleshooting

### Frontend Issues:

**Port 5173 already in use:**
```bash
# Vite will automatically use the next available port
# Or specify a custom port:
npm run dev -- --port 3000
```

**Dependencies not installing:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues:

**MongoDB not running:**
```bash
# Install MongoDB locally or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your connection string
```

**Port 5000 already in use:**
```bash
# Change PORT in .env file
PORT=5001
```

## 📝 Next Steps

1. **Customize the branding**: Update colors in `src/index.css`
2. **Add more features**: Implement product CRUD operations
3. **Connect to real API**: Wire up frontend to backend endpoints
4. **Add M-Pesa integration**: Implement Daraja API
5. **Deploy**: Host on Vercel (frontend) and Render/Heroku (backend)

## 🚀 Deployment

### Frontend (Vercel):
```bash
npm run build
# Upload dist/ folder to Vercel
```

### Backend (Render/Heroku):
```bash
# Push to GitHub
# Connect repository to Render/Heroku
# Set environment variables
# Deploy!
```

## 📚 Resources

- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Recharts**: https://recharts.org
- **MongoDB**: https://mongodb.com
- **Express.js**: https://expressjs.com

## 💡 Tips

- Use browser DevTools to inspect components
- Check browser console for any errors
- Use React DevTools extension for debugging
- Test responsive design with device emulation
- Keep both frontend and backend terminals open during development

---

**Need help?** Check the main README.md for detailed documentation.

**Happy coding! 🎉**
