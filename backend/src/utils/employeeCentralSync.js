const { lookupEmployeeByEmail } = require('../services/mwsDataCenterClient');

// Central's employment_type is uppercase (PERMANENT, CONTRACT, PART_TIME,
// PROBATION, FREELANCE, WFH) - see mws-data-center's EmploymentType enum.
// Every value now has a slot in User.js's employmentStatus enum; keep the
// two lists in sync if Central ever adds another EmploymentType value.
const CENTRAL_EMPLOYMENT_STATUS_MAP = {
    PERMANENT: 'Permanent',
    CONTRACT: 'Contract',
    PART_TIME: 'Part Time',
    PROBATION: 'Probation',
    FREELANCE: 'Freelance',
    WFH: 'WFH',
};

const normalizeEmploymentStatus = (value) => {
    const cleaned = typeof value === 'string' ? value.trim().toUpperCase() : '';
    return CENTRAL_EMPLOYMENT_STATUS_MAP[cleaned];
};

async function syncEmployeeFromCentral(email) {
    const centralEmployee = await lookupEmployeeByEmail(email);
    if (!centralEmployee) return null;

    const fields = {
        name: centralEmployee.full_name,
        employeeId: centralEmployee.employee_id,
        jobPosition: centralEmployee.job_position,
        jobLevel: centralEmployee.job_level,
        isTeachingRole: centralEmployee.is_teaching_role,
        employmentStatus: normalizeEmploymentStatus(centralEmployee.employment_type),
        department: centralEmployee.unit,
        unit: centralEmployee.unit
    };
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);
    return fields;
}

module.exports = { syncEmployeeFromCentral, normalizeEmploymentStatus };
