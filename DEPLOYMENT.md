# DEPLOYMENT GUIDE - DukaFlow

## 🚀 DEPLOYMENT OVERVIEW

This guide covers deploying DukaFlow to production environments.

---

## 📋 PREREQUISITES

1. **MongoDB Atlas Account** (or self-hosted MongoDB)
2. **Vercel Account** (for frontend)
3. **Render/Railway Account** (for backend)
4. **Domain Name** (optional, for custom subdomains)
5. **Email Service Account** (SendGrid, Brevo, or Gmail)

---

## 🗄️ DATABASE SETUP

### Option 1: MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (Free tier available)
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for all)
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/dukaflow?retryWrites=true&w=majority
   ```

### Option 2: Self-Hosted MongoDB

1. Install MongoDB on your server
2. Create database: `dukaflow`
3. Set up authentication
4. Update connection string in environment variables

---

## 🎨 FRONTEND DEPLOYMENT (Vercel)

### Step 1: Prepare Repository

```bash
# Commit all changes
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel project settings, add:

```
VITE_API_URL=https://your-backend-url.com/api
VITE_SOCKET_URL=https://your-backend-url.com
```

### Step 4: Deploy

Click "Deploy" and wait for build to complete.

Your frontend will be available at: `https://your-project.vercel.app`

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain: `app.dukaflow.com`
3. Configure DNS records as instructed

---

## ⚙️ BACKEND DEPLOYMENT (Render)

### Step 1: Prepare Backend

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
```

### Step 2: Deploy to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name**: dukaflow-api
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Plan**: Free (or paid for production)

### Step 3: Set Environment Variables

In Render dashboard, add:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dukaflow
JWT_SECRET=your_production_secret_key_minimum_32_characters
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend-url.vercel.app
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

### Step 4: Deploy

Click "Create Web Service" and wait for deployment.

Your backend will be available at: `https://dukaflow-api.onrender.com`

---

## 📧 EMAIL SERVICE SETUP

### Option 1: SendGrid (Recommended)

1. Create account at https://sendgrid.com
2. Verify your domain
3. Create API Key
4. Update environment variables:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your_api_key
   ```

### Option 2: Gmail SMTP

1. Enable 2FA on your Google account
2. Generate App Password
3. Update environment variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

---

## 🌐 CUSTOM DOMAIN & SUBDOMAINS

### DNS Configuration

Set up these DNS records:

```
Type    Name                    Value
A       dukaflow.com            Vercel IP
CNAME   app                     cname.vercel-dns.com
CNAME   admin                   your-backend-url.onrender.com
CNAME   *.shops                 cname.vercel-dns.com (for shop subdomains)
```

### Subdomain Routing

Implement subdomain routing in your backend:

```javascript
// Middleware to extract shop from subdomain
const shopMiddleware = (req, res, next) => {
  const host = req.headers.host;
  const subdomain = host.split('.')[0];
  
  if (subdomain !== 'app' && subdomain !== 'admin' && subdomain !== 'www') {
    req.shopSlug = subdomain;
  }
  
  next();
};
```

---

## 🔒 SECURITY CHECKLIST

### Before Deploying:

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS (automatic with Vercel/Render)
- [ ] Set CORS to production URLs only
- [ ] Enable rate limiting on API
- [ ] Set up database backups
- [ ] Configure error monitoring (Sentry)
- [ ] Enable logging
- [ ] Remove console.log statements
- [ ] Test all environment variables

### Production Environment Variables:

**Frontend (.env.production):**
```
VITE_API_URL=https://api.dukaflow.com
VITE_SOCKET_URL=https://api.dukaflow.com
```

**Backend:**
```
NODE_ENV=production
MONGODB_URI=<production_uri>
JWT_SECRET=<strong_random_secret>
JWT_EXPIRE=7d
CLIENT_URL=https://app.dukaflow.com
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=<sendgrid_api_key>
```

---

## 📊 MONITORING & LOGGING

### Recommended Tools:

1. **Error Tracking**: Sentry (https://sentry.io)
2. **Uptime Monitoring**: UptimeRobot (https://uptimerobot.com)
3. **Analytics**: Google Analytics or Plausible
4. **Logs**: Render logs or Papertrail

### Setup Sentry:

```bash
npm install @sentry/react @sentry/node
```

```javascript
// Frontend (main.jsx)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## 🔄 CI/CD (Optional)

### GitHub Actions Example:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🚀 DEPLOYMENT COMMANDS

### Quick Deploy (if using Docker):

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Deploy:

```bash
# Frontend
npm run build
vercel --prod

# Backend
cd server
git push
# Render auto-deploys on push to main
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Verify frontend loads correctly
- [ ] Test user registration flow
- [ ] Test login/logout
- [ ] Verify database connection
- [ ] Test API endpoints
- [ ] Check real-time features (Socket.io)
- [ ] Verify cron jobs are running
- [ ] Test email notifications
- [ ] Check error logging
- [ ] Monitor performance
- [ ] Set up database backups
- [ ] Configure custom domain (if applicable)
- [ ] Test on mobile devices
- [ ] Verify SSL certificate
- [ ] Check CORS configuration

---

## 🆘 TROUBLESHOOTING

### Frontend Issues:

**Build fails:**
```bash
# Check for missing environment variables
cat .env.production

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**API calls fail:**
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Check browser console for errors

### Backend Issues:

**Database connection fails:**
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Verify network access settings

**Cron jobs not running:**
- Check server logs
- Verify node-cron is installed
- Check timezone settings

---

## 📞 SUPPORT

For deployment issues:
- Check logs: `docker-compose logs` or Render dashboard
- Review environment variables
- Test API endpoints with Postman
- Check MongoDB connection string

---

**Good luck with your deployment! 🎉**
