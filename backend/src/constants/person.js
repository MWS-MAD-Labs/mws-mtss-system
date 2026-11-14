const PERSON_TYPE = Object.freeze({
    EMPLOYEE: 'employee',
    STUDENT: 'student',
});

// Whether Central gives the person access to this application right now.
const CENTRAL_STATUS = Object.freeze({
    ACTIVE: 'active',
    NO_ACCESS: 'no_access',
});

module.exports = { PERSON_TYPE, CENTRAL_STATUS };
