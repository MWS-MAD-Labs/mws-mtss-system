// Same keys as backend/src/constants/permissions.js. Central decides who holds them.
export const PERMISSIONS = Object.freeze({
    MTSS_READ: 'mtss.read',
    MTSS_WRITE: 'mtss.write',
    MTSS_ADMIN: 'mtss.admin',
    MTSS_SCOPE_UNIT: 'mtss.scope.unit',
    MTSS_SCOPE_ALL: 'mtss.scope.all',
    EMOTIONAL_DASHBOARD_READ: 'emotional_dashboard.read',
    AI_CHAT_USE: 'ai_chat.use',
    AI_INSIGHTS_READ: 'ai_insights.read',
    AI_INSIGHTS_WRITE: 'ai_insights.write',
    NOTIFICATIONS_BROADCAST: 'notifications.broadcast',
    USERS_READ: 'users.read',
    SYNC_READ: 'sync.read',
    DEV_TOPOLOGY_READ: 'dev_topology.read',
});
