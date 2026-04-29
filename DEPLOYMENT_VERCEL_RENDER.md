# 🚀 DukaFlow Deployment Guide - Vercel & Render

This guide will walk you through deploying your DukaFlow application to **Vercel** (frontend) and **Render** (backend).

---

## 📋 Prerequisites

1. ✅ GitHub account with your code pushed
2. ✅ Vercel account (free): https://vercel.com
3. ✅ Render account (free): https://render.com
4. ✅ MongoDB Atlas account (free): https://www.mongodb.com/cloud/atlas

---

## 🗄️ Step 1: Setup MongoDB Atlas

### 1.1 Create a Cluster
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new **FREE** cluster (M0)
4. Wait for cluster to be created (2-3 minutes)

### 1.2 Create Database User
1. Click **Database Access** in left sidebar
2. Click **+ ADD NEW DATABASE USER**
3. Choose **Password** authentication
4. Set username and password (save these!)
5. Set permissions to **Read and write to any database**
6. Click **Add User**

### 1.3 Configure Network Access
1. Click **Network Access** in left sidebar
2. Click **+ ADD IP ADDRESS**
3. Click **ALLOW ACCESS FROM ANYWHERE** (0.0.0.0/0)
4. Click **Confirm**

### 1.4 Get Connection String
1. Click **Database** in left sidebar
2. Click **Connect** on your cluster
3. Choose **Drivers**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `dukaflow`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dukaflow?retryWrites=true&w=majority
```

---

## ⚙️ Step 2: Deploy Backend to Render

### 2.1 Create Web Service
1. Go to https://render.com and login
2. Click **New +** → **Web Service**
3. Connect your GitHub account
4. Select your repository: `DukaFlow`
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `dukaflow-api` |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.2 Set Environment Variables

Click **Advanced** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dukaflow` (from Step 1) |
| `JWT_SECRET` | Click **Generate** or use a random 64-character string |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | `https://localhost:5173` (update after frontend deployment) |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | Your Gmail address (optional for now) |
| `EMAIL_PASS` | Your Gmail app password (optional for now) |

**Note:** For `JWT_SECRET`, you can generate one using:
```javascript
require('crypto').randomBytes(64).toString('hex')
```

### 2.3 Deploy
1. Click **Create Web Service**
2. Wait for deployment (2-5 minutes)
3. Copy your backend URL (e.g., `https://dukaflow-api.onrender.com`)

### 2.4 Test Backend
Visit: `https://your-backend-url.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "DukaFlow API is running"
}
```

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Import Project
1. Go to https://vercel.com and login
2. Click **Add New...** → **Project**
3. Import your `DukaFlow` repository from GitHub
4. Vercel will auto-detect it's a Vite project

### 3.2 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3.3 Set Environment Variables

Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api` (from Step 2) |
| `VITE_SOCKET_URL` | `https://your-backend-url.onrender.com` (from Step 2) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key (if using Clerk) |

### 3.4 Deploy
1. Click **Deploy**
2. Wait for build (1-2 minutes)
3. Your frontend is now live! (e.g., `https://dukaflow.vercel.app`)

---

## 🔗 Step 4: Connect Frontend & Backend

### 4.1 Update Backend CLIENT_URL
1. Go to your Render dashboard
2. Open `dukaflow-api` service
3. Go to **Environment** tab
4. Update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://your-app.vercel.app
   ```
5. Click **Save Changes**
6. Render will automatically redeploy

### 4.2 Test the Connection
1. Visit your Vercel URL
2. Try to register a new account
3. If it works, you're all set! 🎉

---

## 📧 Optional: Setup Email (Gmail)

If you want email notifications:

### 1. Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com
2. Enable **2-Step Verification**

### 2. Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** and your device
3. Click **Generate**
4. Copy the 16-character password

### 3. Update Render Environment Variables
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx (the app password)
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check works: `/api/health`
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads with data
- [ ] Products can be created/edited
- [ ] Sales can be recorded
- [ ] Real-time updates work (Socket.io)
- [ ] Mobile responsive design works
- [ ] No console errors in browser

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
**Problem:** CORS errors or API calls fail

**Solution:**
1. Check `VITE_API_URL` in Vercel matches your Render URL
2. Check `CLIENT_URL` in Render matches your Vercel URL
3. Redeploy both services after changes

### Backend not starting
**Problem:** Render deployment fails

**Solution:**
1. Check logs in Render dashboard
2. Verify `MONGODB_URI` is correct
3. Make sure MongoDB Atlas IP whitelist includes 0.0.0.0/0
4. Check all required environment variables are set

### Database connection error
**Problem:** Can't connect to MongoDB

**Solution:**
1. Verify connection string is correct
2. Check username/password are correct
3. Ensure IP whitelist allows all IPs (0.0.0.0/0)
4. Test connection string locally first

### Socket.io not working
**Problem:** Real-time features don't work

**Solution:**
1. Verify `VITE_SOCKET_URL` is set correctly (without `/api`)
2. Check browser console for WebSocket errors
3. Ensure Render supports WebSocket connections (free tier does)

---

## 🎯 Your Deployment URLs

After deployment, you'll have:

- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-api.onrender.com`
- **API Documentation:** `https://your-api.onrender.com/api/health`
- **MongoDB:** `mongodb+srv://...` (Atlas cloud)

---

## 💡 Tips

1. **Free Tier Limitations:**
   - Render free tier spins down after 15 minutes of inactivity
   - First request after spin-up takes 30-60 seconds
   - Consider upgrading for production use

2. **Environment Variables:**
   - Never commit `.env` files to GitHub
   - Use Vercel/Render dashboards to manage them
   - Prefix frontend vars with `VITE_`

3. **Updates:**
   - Push to `main` branch to auto-deploy
   - Both Vercel and Render watch for changes
   - Check deployment logs if something breaks

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas

---

**Happy Deploying! 🚀**
