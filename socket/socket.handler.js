/**
 * Socket.io event handlers for real-time features
 */
const setupSocketHandlers = (io) => {
    // Store connected users
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // User authentication via socket
        socket.on('authenticate', (userId) => {
            connectedUsers.set(userId, socket.id);
            socket.userId = userId;
            socket.join(`user_${userId}`);
            console.log(`User ${userId} authenticated and joined room`);
        });

        // Order status update event (from admin)
        socket.on('orderStatusUpdate', (data) => {
            const { orderId, status, userId } = data;

            // Emit to specific user
            io.to(`user_${userId}`).emit('orderStatusChanged', {
                orderId,
                status,
                timestamp: new Date()
            });

            // Emit to all admin clients
            io.to('admin_room').emit('orderUpdated', data);
        });

        // Stock update event (from admin)
        socket.on('stockUpdate', (data) => {
            const { productId, variants } = data;

            // Broadcast stock update to all clients
            io.emit('productStockUpdated', {
                productId,
                variants,
                timestamp: new Date()
            });
        });

        // New order notification (to admin)
        socket.on('newOrder', (orderData) => {
            io.to('admin_room').emit('newOrderReceived', {
                ...orderData,
                timestamp: new Date()
            });
        });

        // Admin join room
        socket.on('joinAdminRoom', () => {
            socket.join('admin_room');
            console.log(`Admin joined: ${socket.id}`);
        });

        // Disconnect event
        socket.on('disconnect', () => {
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                console.log(`User ${socket.userId} disconnected`);
            }
            console.log(`❌ Client disconnected: ${socket.id}`);
        });

        // Error handling
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    return io;
};

module.exports = setupSocketHandlers;
