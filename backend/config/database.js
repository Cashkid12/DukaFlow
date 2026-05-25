const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Keep connection alive with heartbeat (Atlas drops idle connections)
      heartbeatFrequencyMS: 10000,       // Ping every 10s
      serverSelectionTimeoutMS: 10000,   // Timeout after 10s when selecting server
      socketTimeoutMS: 45000,            // Close sockets after 45s of inactivity
      maxPoolSize: 10,                   // Maintain up to 10 socket connections
      minPoolSize: 2,                    // Keep at least 2 connections open
      maxIdleTimeMS: 30000,              // Close idle connections after 30s
      connectTimeoutMS: 10000,           // Give up initial connection after 10s
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — will attempt to reconnect automatically');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
