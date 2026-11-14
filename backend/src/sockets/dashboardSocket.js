// Feature 1 (dashboard live check-in stats) disabled 2026-09-07: this used
// to query EmotionalCheckin (a collection meant to be owned by
// mws-daily-checkin, not read directly by MTSS - see the MongoDB
// separation work that day) and emit 'dashboard:update'/'checkin:new'/
// 'user:flagged' on every socket join/refresh. The frontend's
// socketService.js never listened for any of those events, so this was
// dead computation even before the DB split - commented out rather than
// deleted in case the underlying feature gets rebuilt properly through
// Central later.
//
// const EmotionalCheckin = require('../models/EmotionalCheckin');
// const cacheService = require('../services/cacheService');

const handleDashboardConnection = (io, socket) => {
    console.log(`Dashboard client connected: ${socket.id}`);

    // The dashboard room is joined in config/socket.js, where it is checked against the signed-in person.

    // Request dashboard refresh - no frontend caller emits 'refresh-dashboard'.
    // socket.on('refresh-dashboard', async (userId) => {
    //     try {
    //         await sendDashboardUpdate(socket, userId);
    //     } catch (error) {
    //         console.error('Error refreshing dashboard:', error);
    //         socket.emit('error', { message: 'Failed to refresh dashboard' });
    //     }
    // });

    socket.on('disconnect', () => {
        console.log(`Dashboard client disconnected: ${socket.id}`);
    });
};

// // Send dashboard update to specific socket
// const sendDashboardUpdate = async (socket, userId) => {
//     try {
//         // Get today's statistics
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);
//
//         const todayCheckins = await EmotionalCheckin.find({
//             date: { $gte: today, $lt: tomorrow }
//         });
//
//         const stats = {
//             totalCheckins: todayCheckins.length,
//             averagePresence: todayCheckins.length > 0
//                 ? Math.round((todayCheckins.reduce((sum, c) => sum + c.presenceLevel, 0) / todayCheckins.length) * 10) / 10
//                 : 0,
//             averageCapacity: todayCheckins.length > 0
//                 ? Math.round((todayCheckins.reduce((sum, c) => sum + c.capacityLevel, 0) / todayCheckins.length) * 10) / 10
//                 : 0,
//             lastUpdated: new Date()
//         };
//
//         socket.emit('dashboard:update', { stats });
//     } catch (error) {
//         console.error('Error sending dashboard update:', error);
//         socket.emit('error', { message: 'Failed to get dashboard data' });
//     }
// };
//
// // Broadcast new check-in to all dashboard clients
// const broadcastNewCheckin = (io, checkinData) => {
//     io.to('dashboard-admin').emit('checkin:new', {
//         id: checkinData._id,
//         userId: checkinData.userId,
//         weatherType: checkinData.weatherType,
//         selectedMoods: checkinData.selectedMoods,
//         presenceLevel: checkinData.presenceLevel,
//         capacityLevel: checkinData.capacityLevel,
//         needsSupport: checkinData.aiAnalysis?.needsSupport || false,
//         submittedAt: checkinData.submittedAt
//     });
// };
//
// // Broadcast flagged user alert
// const broadcastFlaggedUser = (io, checkinData) => {
//     if (checkinData.aiAnalysis?.needsSupport) {
//         io.to('dashboard-admin').emit('user:flagged', {
//             checkinId: checkinData._id,
//             userId: checkinData.userId,
//             presenceLevel: checkinData.presenceLevel,
//             capacityLevel: checkinData.capacityLevel,
//             weatherType: checkinData.weatherType,
//             flaggedAt: checkinData.submittedAt
//         });
//     }
// };

module.exports = {
    handleDashboardConnection
    // sendDashboardUpdate,
    // broadcastNewCheckin,
    // broadcastFlaggedUser
};
