import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.personalUserId = null;
        this.dashboardUserId = null;
        this.notificationUserId = null;
        this.mtssAdminJoined = false;
        this.mtssMentorId = null;
        this.mtssLiveScope = null;
    }

    canEmit() {
        return Boolean(this.socket);
    }

    emit(event, payload) {
        if (this.canEmit()) {
            this.socket.emit(event, payload);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    rejoinTrackedRooms() {
        if (this.dashboardUserId) {
            this.emit('join-dashboard', this.dashboardUserId);
        }
        if (this.personalUserId) {
            this.emit('join-personal', this.personalUserId);
        }
        if (this.notificationUserId) {
            this.emit('join-notifications', this.notificationUserId);
        }
        if (this.mtssAdminJoined) {
            this.emit('join-mtss-admin');
        }
        if (this.mtssMentorId) {
            this.emit('join-mtss-mentor', this.mtssMentorId);
        }
        if (this.mtssLiveScope) {
            this.emit('join-mtss-live', this.mtssLiveScope);
        }
    }

    connect() {
        if (this.socket) {
            return this.socket;
        }

        const rawBase = import.meta.env.VITE_API_BASE || '/api/v1';
        // Buang suffix /api/v1 → dapat base prefix (mis. '/mtss' atau '' untuk root).
        const basePrefix = rawBase.replace(/\/api(?:\/v\d+)?\/?$/, '');

        // Connect ke origin saat ini; socket.io PATH harus berprefix base agar
        // cocok dengan proxy gateway/nginx (/mtss/socket.io → backend /socket.io).
        // Jangan kirim base sebagai URL — itu akan ditafsirkan sebagai namespace.
        this.socket = io({
            path: `${basePrefix}/socket.io`,
            transports: ['websocket', 'polling'],
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            console.log('Connected to Socket.io server');
            this.isConnected = true;
            this.rejoinTrackedRooms();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
    }

    joinDashboard(userId) {
        if (!userId) return;
        this.dashboardUserId = userId;
        this.emit('join-dashboard', userId);
    }

    leaveDashboard(userId) {
        const targetUserId = userId || this.dashboardUserId;
        if (!targetUserId) return;
        this.emit('leave-dashboard', targetUserId);
        if (String(targetUserId) === String(this.dashboardUserId || '')) {
            this.dashboardUserId = null;
        }
    }

    joinPersonal(userId) {
        if (!userId) return;
        this.personalUserId = userId;
        this.emit('join-personal', userId);
    }

    leavePersonal(userId) {
        const targetUserId = userId || this.personalUserId;
        if (!targetUserId) return;
        this.emit('leave-personal', targetUserId);
        if (String(targetUserId) === String(this.personalUserId || '')) {
            this.personalUserId = null;
        }
    }

    joinNotifications(userId) {
        if (!userId) return;
        this.notificationUserId = userId;
        this.emit('join-notifications', userId);
    }

    leaveNotifications(userId) {
        const targetUserId = userId || this.notificationUserId;
        if (!targetUserId) return;
        this.emit('leave-notifications', targetUserId);
        if (String(targetUserId) === String(this.notificationUserId || '')) {
            this.notificationUserId = null;
        }
    }

    onDashboardUpdate(callback) { this.on('dashboard:update', callback); }
    onNewCheckin(callback) { this.on('dashboard:new-checkin', callback); }
    onUserFlagged(callback) { this.on('user:flagged', callback); }
    onSupportRequestHandled(callback) { this.on('support_request_handled', callback); }
    onPersonalNewCheckin(callback) { this.on('personal:new-checkin', callback); }

    joinMtssAdmin() {
        this.mtssAdminJoined = true;
        this.emit('join-mtss-admin');
    }
    leaveMtssAdmin() {
        this.emit('leave-mtss-admin');
        this.mtssAdminJoined = false;
    }
    joinMtssMentor(mentorId) {
        if (!mentorId) return;
        this.mtssMentorId = mentorId;
        this.emit('join-mtss-mentor', mentorId);
    }
    leaveMtssMentor(mentorId) {
        const targetMentorId = mentorId || this.mtssMentorId;
        if (!targetMentorId) return;
        this.emit('leave-mtss-mentor', targetMentorId);
        if (String(targetMentorId) === String(this.mtssMentorId || '')) {
            this.mtssMentorId = null;
        }
    }
    joinMtssLive(scope = 'all') {
        this.mtssLiveScope = scope || 'all';
        this.emit('join-mtss-live', this.mtssLiveScope);
    }
    leaveMtssLive(scope) {
        const targetScope = scope || this.mtssLiveScope || 'all';
        this.emit('leave-mtss-live', targetScope);
        if (String(targetScope) === String(this.mtssLiveScope || '')) {
            this.mtssLiveScope = null;
        }
    }
    joinDevTopology() { this.emit('join-dev-topology'); }
    leaveDevTopology() { this.emit('leave-dev-topology'); }

    onMtssStudentsChanged(callback) { this.on('mtss:students:changed', callback); }
    offMtssStudentsChanged(callback) { this.off('mtss:students:changed', callback); }
    onMtssAssignment(callback) { this.on('mtss:assignment', callback); }
    offMtssAssignment(callback) { this.off('mtss:assignment', callback); }
    onMtssRefresh(callback) { this.on('mtss:refresh', callback); }
    offMtssRefresh(callback) { this.off('mtss:refresh', callback); }
    onMtssPilotFeedbackUpdate(callback) { this.on('mtss:pilot-feedback:update', callback); }
    offMtssPilotFeedbackUpdate(callback) { this.off('mtss:pilot-feedback:update', callback); }
    onDevTopologyUpdate(callback) { this.on('dev-topology:update', callback); }
    offDevTopologyUpdate(callback) { this.off('dev-topology:update', callback); }
    onDevTopologySnapshot(callback) { this.on('dev-topology:snapshot', callback); }
    offDevTopologySnapshot(callback) { this.off('dev-topology:snapshot', callback); }

    onNotificationNew(callback) { this.on('notification:new', callback); }
    offNotificationNew(callback) { this.off('notification:new', callback); }
    onNotificationUpdated(callback) { this.on('notification:updated', callback); }
    offNotificationUpdated(callback) { this.off('notification:updated', callback); }
    onNotificationDeleted(callback) { this.on('notification:deleted', callback); }
    offNotificationDeleted(callback) { this.off('notification:deleted', callback); }
    onNotificationBulkRead(callback) { this.on('notification:bulk-read', callback); }
    offNotificationBulkRead(callback) { this.off('notification:bulk-read', callback); }

    offDashboardUpdate(callback) { this.off('dashboard:update', callback); }
    offNewCheckin(callback) { this.off('dashboard:new-checkin', callback); }
    offUserFlagged(callback) { this.off('user:flagged', callback); }
    offSupportRequestHandled(callback) { this.off('support_request_handled', callback); }
    offPersonalNewCheckin(callback) { this.off('personal:new-checkin', callback); }

    get isSocketConnected() {
        return this.isConnected;
    }

    getSocket() {
        return this.socket;
    }
}

const socketService = new SocketService();

export default socketService;
