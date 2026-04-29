const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join shop-specific room
    socket.on('join:shop', (shopId) => {
      socket.join(shopId);
      console.log(`📦 Socket ${socket.id} joined shop room: ${shopId}`);
    });

    // Leave shop room
    socket.on('leave:shop', (shopId) => {
      socket.leave(shopId);
      console.log(`📦 Socket ${socket.id} left shop room: ${shopId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper function to emit events to specific shop
const emitToShop = (shopId, event, data) => {
  if (io) {
    io.to(shopId).emit(event, data);
  }
};

// Helper function to broadcast to all connected clients
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = { initializeSocket, emitToShop, broadcast };
