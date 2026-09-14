const { lookupEmployeeByEmail } = require('../services/mwsDataCenterClient');

async function syncEmployeeFromCentral(email) {
    const centralEmployee = await lookupEmployeeByEmail(email);
    if (!centralEmployee) return null;

    const fields = {
        name: centralEmployee.full_name,
        gender: centralEmployee.gender,
        employeeId: centralEmployee.employee_id,
        jobPosition: centralEmployee.job_position,
        jobLevel: centralEmployee.job_level,
        isTeachingRole: centralEmployee.is_teaching_role,
        // Central's exact EmploymentType enum (PERMANENT, CONTRACT,
        // PART_TIME, PROBATION, FREELANCE, WFH) - passed through as-is, no
        // local mapping table.
        employmentStatus: centralEmployee.employment_type,
        department: centralEmployee.unit,
        unit: centralEmployee.unit
    };
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);
    return fields;
}

module.exports = { syncEmployeeFromCentral };
