// What Central can allow in MTSS. A role in Central is a set of these, and the code only ever asks for one of them:
// it never looks at a role name. The list goes to Central with `npm run permissions:sync`, so a role can only be built
// from what the code knows.
const PERMISSIONS = Object.freeze({
    MTSS_READ: 'mtss.read',
    MTSS_WRITE: 'mtss.write',
    MTSS_ADMIN: 'mtss.admin',
    MTSS_SCOPE_UNIT: 'mtss.scope.unit',
    MTSS_SCOPE_ALL: 'mtss.scope.all',
    EMOTIONAL_DASHBOARD_READ: 'emotional-dashboard.read',
    AI_CHAT_USE: 'ai-chat.use',
    AI_INSIGHTS_READ: 'ai-insights.read',
    AI_INSIGHTS_WRITE: 'ai-insights.write',
    NOTIFICATIONS_BROADCAST: 'notifications.broadcast',
    USERS_READ: 'users.read',
    SYNC_READ: 'sync.read',
    DEV_TOPOLOGY_READ: 'dev-topology.read',
    HUB_SUPPORT_ACCESS: 'hub.support.access',
});

// What Central shows next to each permission. `requires` keeps a role from carrying a permission without the ones it
// cannot work without.
const PERMISSION_DETAILS = Object.freeze({
    [PERMISSIONS.MTSS_READ]: {
        description: 'Open MTSS: tiers, strategies, students and mentor assignments. Without a scope permission it shows only the students of my assigned classes and the students I support',
    },
    [PERMISSIONS.MTSS_WRITE]: {
        description: 'Record interventions and mentor assignments and upload evidence. People with this permission can be chosen as mentors',
        requires: [PERMISSIONS.MTSS_READ],
    },
    [PERMISSIONS.MTSS_ADMIN]: {
        description: 'Set up tiers and strategies, add and change MTSS students, see the mentors and pilot feedback, and reassign mentors',
        requires: [PERMISSIONS.MTSS_READ],
    },
    [PERMISSIONS.MTSS_SCOPE_UNIT]: {
        description: 'See every student of my own unit in MTSS',
        requires: [PERMISSIONS.MTSS_READ],
    },
    [PERMISSIONS.MTSS_SCOPE_ALL]: {
        description: 'See every student of every unit in MTSS',
        requires: [PERMISSIONS.MTSS_READ],
    },
    [PERMISSIONS.EMOTIONAL_DASHBOARD_READ]: { description: 'Open the emotional check-in dashboard' },
    [PERMISSIONS.AI_CHAT_USE]: { description: 'Use the AI assistant' },
    [PERMISSIONS.AI_INSIGHTS_READ]: { description: 'See AI insights and alerts about students' },
    [PERMISSIONS.AI_INSIGHTS_WRITE]: {
        description: 'Generate alerts and update their status',
        requires: [PERMISSIONS.AI_INSIGHTS_READ],
    },
    [PERMISSIONS.NOTIFICATIONS_BROADCAST]: { description: 'Send system notifications to other people' },
    [PERMISSIONS.USERS_READ]: { description: 'See the people of MTSS and what each may do' },
    [PERMISSIONS.SYNC_READ]: { description: 'See when MTSS last synced with Central' },
    [PERMISSIONS.DEV_TOPOLOGY_READ]: { description: 'Open the developer topology and health views' },
    [PERMISSIONS.HUB_SUPPORT_ACCESS]: { description: 'Open the Support Hub from the quick menu' },
});

const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));
const PERMISSION_SET = new Set(PERMISSION_VALUES);

module.exports = { PERMISSIONS, PERMISSION_DETAILS, PERMISSION_VALUES, PERMISSION_SET };
