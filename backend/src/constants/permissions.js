// What Central can allow in MTSS. A role in Central is a set of these, and the code only ever asks for one of them:
// it never looks at a role name. The vocabulary for the MTSS screens and routes is added with the move of the route
// gates; these are the ones that do not belong to a screen.
const PERMISSIONS = Object.freeze({
    USERS_READ: 'users.read',
    SYNC_READ: 'sync.read',
});

const PERMISSION_DETAILS = Object.freeze({
    [PERMISSIONS.USERS_READ]: { description: 'See the people of MTSS and what each may do' },
    [PERMISSIONS.SYNC_READ]: { description: 'See when MTSS last synced with Central' },
});

const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));
const PERMISSION_SET = new Set(PERMISSION_VALUES);

module.exports = { PERMISSIONS, PERMISSION_DETAILS, PERMISSION_VALUES, PERMISSION_SET };
