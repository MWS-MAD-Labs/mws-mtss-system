const { lookupEmployeeByEmail } = require('../services/mwsDataCenterClient');

const normalizeEmploymentStatus = (value) => {
    const cleaned = typeof value === 'string' ? value.trim() : '';
    if (['Permanent', 'Contract', 'Probation'].includes(cleaned)) return cleaned;
    return undefined;
};

async function syncEmployeeFromCentral(email) {
    const centralEmployee = await lookupEmployeeByEmail(email);
    if (!centralEmployee) return null;

    const fields = {
        name: centralEmployee.full_name,
        employeeId: centralEmployee.employee_id,
        jobPosition: centralEmployee.job_position,
        jobLevel: centralEmployee.job_level,
        employmentStatus: normalizeEmploymentStatus(centralEmployee.employment_type),
        department: centralEmployee.unit,
        unit: centralEmployee.unit
    };
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);
    return fields;
}

module.exports = { syncEmployeeFromCentral };
