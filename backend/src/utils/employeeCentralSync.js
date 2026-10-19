const { lookupEmployeeByEmail, lookupEmployeeByPersonId } = require('../services/mwsDataCenterClient');

// What MTSS keeps about an employee, from the record Central has.
function mapCentralEmployee(centralEmployee) {
    const fields = {
        centralPersonId: centralEmployee.person_id,
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

// By Central's person id first when it is known (it does not change when an email does), then by email.
async function syncEmployeeFromCentral(email, centralPersonId) {
    const centralEmployee = centralPersonId
        ? await lookupEmployeeByPersonId(centralPersonId) || await lookupEmployeeByEmail(email)
        : await lookupEmployeeByEmail(email);
    if (!centralEmployee) return null;
    return mapCentralEmployee(centralEmployee);
}

module.exports = { syncEmployeeFromCentral, mapCentralEmployee };
