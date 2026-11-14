const { PERMISSIONS } = require('../constants/permissions');
const { CENTRAL_STATUS } = require('../constants/person');

// Who can be chosen as a mentor: the active employees whose role in Central lets them write in MTSS. There is no
// list of job titles here, Central decides.
const mentorFilter = () => ({
    personType: 'employee',
    isActive: true,
    centralStatus: CENTRAL_STATUS.ACTIVE,
    centralEntitlementPermissions: PERMISSIONS.MTSS_WRITE,
});

// The same question for a person already in hand.
const canBeMentor = (person) => Boolean(
    person
    && person.personType === 'employee'
    && person.isActive
    && person.centralStatus === CENTRAL_STATUS.ACTIVE
    && (person.centralEntitlementPermissions || person.permissions || []).includes(PERMISSIONS.MTSS_WRITE)
);

module.exports = { mentorFilter, canBeMentor };
