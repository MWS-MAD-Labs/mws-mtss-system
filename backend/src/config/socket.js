const socketIo = require('socket.io');
const winston = require('winston');
const { createCorsOriginChecker } = require('./cors');
const devTopologyTelemetryService = require('../services/devTopologyTelemetryService');
const { canJoin, userFromHandshake } = require('../utils/socketAccess');

let io;
let devTopologyBridgeInitialized = false;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: createCorsOriginChecker(),
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // A connection is the Hub's session, like any request. No cookie, no connection.
    io.use(async (socket, next) => {
        try {
            const user = await userFromHandshake(socket.handshake);
            if (!user) return next(new Error('unauthorized'));
            socket.data.user = user;
            return next();
        } catch (error) {
            winston.warn(`Socket authentication failed: ${error.message}`);
            return next(new Error('unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        winston.info(`User connected: ${socket.id}`);

        // Joins a room only when this person may be in it (utils/socketAccess.js).
        const joinIfAllowed = (kind, room, arg) => {
            if (!canJoin(kind, socket.data.user, arg)) {
                winston.warn(`Socket ${socket.id} was refused the ${kind} room`);
                return false;
            }
            socket.join(room);
            return true;
        };

        // Join dashboard room for real-time updates
        socket.on('join-dashboard', (userId) => {
            if (joinIfAllowed('dashboard', `dashboard-${userId}`, userId)) winston.info(`User ${userId} joined dashboard room`);
        });

        // Leave dashboard room
        socket.on('leave-dashboard', (userId) => {
            socket.leave(`dashboard-${userId}`);
            winston.info(`User ${userId} left dashboard room`);
        });

        // Join personal room for real-time personal updates
        socket.on('join-personal', (userId) => {
            if (joinIfAllowed('personal', `personal-${userId}`, userId)) winston.info(`User ${userId} joined personal room`);
        });

        // Leave personal room
        socket.on('leave-personal', (userId) => {
            socket.leave(`personal-${userId}`);
            winston.info(`User ${userId} left personal room`);
        });

        // Notification stream room (separate from generic personal room)
        socket.on('join-notifications', (userId) => {
            if (joinIfAllowed('notifications', `notifications-${userId}`, userId)) winston.info(`User ${userId} joined notifications room`);
        });

        socket.on('leave-notifications', (userId) => {
            socket.leave(`notifications-${userId}`);
            winston.info(`User ${userId} left notifications room`);
        });

        socket.on('join-mtss-admin', () => {
            if (joinIfAllowed('mtss-admin', 'mtss-admin')) winston.info(`Socket ${socket.id} joined mtss-admin room`);
        });

        socket.on('leave-mtss-admin', () => {
            socket.leave('mtss-admin');
            winston.info(`Socket ${socket.id} left mtss-admin room`);
        });

        socket.on('join-mtss-mentor', (mentorId) => {
            if (!mentorId) return;
            if (joinIfAllowed('mtss-mentor', `mtss-mentor-${mentorId}`, mentorId)) winston.info(`Mentor ${mentorId} joined MTSS mentor room`);
        });

        socket.on('leave-mtss-mentor', (mentorId) => {
            if (!mentorId) return;
            socket.leave(`mtss-mentor-${mentorId}`);
            winston.info(`Mentor ${mentorId} left MTSS mentor room`);
        });

        socket.on('join-mtss-live', (scope = 'all') => {
            const normalizedScope = String(scope || 'all').trim() || 'all';
            if (joinIfAllowed('mtss-live', `mtss-live-${normalizedScope}`, normalizedScope)) winston.info(`Socket ${socket.id} joined mtss-live-${normalizedScope} room`);
        });

        socket.on('leave-mtss-live', (scope = 'all') => {
            const normalizedScope = String(scope || 'all').trim() || 'all';
            socket.leave(`mtss-live-${normalizedScope}`);
            winston.info(`Socket ${socket.id} left mtss-live-${normalizedScope} room`);
        });

        socket.on('join-dev-topology', () => {
            if (!joinIfAllowed('dev-topology', devTopologyTelemetryService.getRoomName())) return;
            try {
                devTopologyTelemetryService.noteViewerSubscribed();
                socket.emit(
                    devTopologyTelemetryService.getSocketEventNames().snapshot,
                    devTopologyTelemetryService.getSnapshot()
                );
            } catch (error) {
                winston.warn(`Failed to emit dev topology snapshot to ${socket.id}: ${error.message}`);
            }
            winston.info(`Socket ${socket.id} joined dev-topology room`);
        });

        socket.on('leave-dev-topology', () => {
            socket.leave(devTopologyTelemetryService.getRoomName());
            devTopologyTelemetryService.noteViewerUnsubscribed();
            winston.info(`Socket ${socket.id} left dev-topology room`);
        });

        socket.on('disconnect', () => {
            // Best-effort viewer count correction if client disconnects without explicit leave.
            if (socket.rooms && socket.rooms.has && socket.rooms.has(devTopologyTelemetryService.getRoomName())) {
                devTopologyTelemetryService.noteViewerUnsubscribed();
            }
            winston.info(`User disconnected: ${socket.id}`);
        });
    });

    if (!devTopologyBridgeInitialized) {
        devTopologyBridgeInitialized = true;
        devTopologyTelemetryService.on('update', (payload) => {
            if (!io) return;
            io.to(devTopologyTelemetryService.getRoomName()).emit(
                devTopologyTelemetryService.getSocketEventNames().update,
                payload
            );
        });
    }

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initSocket, getIO };
