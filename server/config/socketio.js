/**
 * Socket.io Configuration
 * 
 * Sets up WebSocket server for real-time communication with clients
 * Used for pushing Airtable updates to connected users in real-time
 * 
 * Architecture:
 * - Each user connects to their own room: 'user_{userId}'
 * - Webhook updates are broadcast to specific user rooms
 * - Clients emit 'join' event with their userId to join their room
 * - Clients listen for 'airtable_update' events
 */

const { Server } = require('socket.io');

/**
 * Initialize Socket.io server
 * 
 * @param {object} server - HTTP server instance (from http.createServer)
 * @param {object} corsOptions - CORS configuration for Socket.io
 * @returns {object} - Socket.io server instance
 */
function initializeSocketIO(server, corsOptions) {
  console.log('🔌 Initializing Socket.io server...');

  // Create Socket.io server with CORS configuration
  const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'], // Support both WebSocket and fallback polling
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  // Connection event handler
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    /**
     * Join Event
     * Client emits this event with their userId to join their personal room
     * 
     * Usage from client:
     * socket.emit('join', { userId: 'user123' });
     */
    socket.on('join', (data) => {
      const { userId } = data;

      if (!userId) {
        console.error(`❌ Join failed for ${socket.id}: No userId provided`);
        socket.emit('error', { message: 'userId is required to join' });
        return;
      }

      const roomName = `user_${userId}`;
      
      // Join the user's room
      socket.join(roomName);
      
      console.log(`👤 Client ${socket.id} joined room: ${roomName}`);

      // Confirm join to client
      socket.emit('joined', {
        roomName: roomName,
        userId: userId,
        message: `Successfully joined room for user ${userId}`,
      });
    });

    /**
     * Leave Event
     * Client can explicitly leave their room
     */
    socket.on('leave', (data) => {
      const { userId } = data;

      if (userId) {
        const roomName = `user_${userId}`;
        socket.leave(roomName);
        console.log(`👋 Client ${socket.id} left room: ${roomName}`);
      }
    });

    /**
     * Disconnect Event
     * Automatically triggered when client disconnects
     */
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    /**
     * Error Event
     * Handle socket errors
     */
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.io server initialized');

  return io;
}

/**
 * Broadcast Airtable update to a specific user's room
 * 
 * This is a helper function that can be called from anywhere in the app
 * 
 * @param {object} io - Socket.io server instance
 * @param {string} userId - User ID to broadcast to
 * @param {object} updateData - Update data to send
 */
function broadcastAirtableUpdate(io, userId, updateData) {
  const roomName = `user_${userId}`;
  
  console.log(`📡 Broadcasting Airtable update to room: ${roomName}`);

  io.to(roomName).emit('airtable_update', {
    type: 'record_updated',
    userId: userId,
    ...updateData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get Socket.io statistics
 * 
 * Useful for debugging and monitoring
 * 
 * @param {object} io - Socket.io server instance
 * @returns {object} - Statistics about connected clients and rooms
 */
async function getSocketStats(io) {
  const sockets = await io.fetchSockets();
  const rooms = io.sockets.adapter.rooms;

  return {
    connectedClients: sockets.length,
    totalRooms: rooms.size,
    rooms: Array.from(rooms.keys()).filter(room => room.startsWith('user_')),
  };
}

module.exports = {
  initializeSocketIO,
  broadcastAirtableUpdate,
  getSocketStats,
};
