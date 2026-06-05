const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import config and services
const connectDB = require('./config/database');
const { initializeSocket } = require('./sockets');
const initializeCronJobs = require('./services/cronService');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const clerkRoutes = require('./routes/clerk');
const dashboardRoutes = require('./routes/dashboard');
const workerRoutes = require('./routes/workers');
const shopRoutes = require('./routes/shop');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const branchRoutes = require('./routes/branches');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Initialize Cron Jobs
initializeCronJobs();

// Middleware
// CORS: allow localhost (any port), 127.0.0.1, and local network IPs in development
// In production, CLIENT_URL can be a comma-separated list of allowed origins
const getAllowedOrigins = () => {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) return ['http://localhost:5173'];
  return clientUrl.split(',').map((u) => u.trim()).filter(Boolean);
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, mobile apps, curl)
    if (!origin) return callback(null, true);

    // In development, allow any localhost/127.0.0.1/192.168.x.x origin
    if (process.env.NODE_ENV === 'development') {
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.')
      ) {
        return callback(null, true);
      }
    }

    // In production, check against allowed origins list
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Also allow any vercel.app subdomain (preview deployments)
    if (origin.endsWith('.vercel.app') || origin === 'https://duka-flow.vercel.app') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/clerk', clerkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/branches', branchRoutes);

// Root route — friendly landing for browser visits
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DukaFlow API is running',
    version: '1.0.0',
    docs: 'All API routes are under /api/',
    health: '/api/health',
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DukaFlow API is running', timestamp: Date.now() });
});

// Socket.io connection (canonical join:shop handler is in sockets/index.js)
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to Database and start server
const startServer = async () => {
  await connectDB();

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

module.exports = { app, io };
