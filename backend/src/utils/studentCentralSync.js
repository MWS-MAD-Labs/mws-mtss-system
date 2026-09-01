const { lookupStudentByEmail } = require('../services/mwsDataCenterClient');
const { buildStudentUserPayload } = require('./studentUserHelpers');

async function syncStudentFromCentral(email) {
    const centralStudent = await lookupStudentByEmail(email);
    if (!centralStudent) return null;

    return buildStudentUserPayload({
        email: centralStudent.email,
        name: centralStudent.full_name,
        nickname: centralStudent.nick_name,
        status: centralStudent.status,
        currentGrade: centralStudent.current_grade,
        className: centralStudent.current_class,
    });
}

module.exports = { syncStudentFromCentral };
