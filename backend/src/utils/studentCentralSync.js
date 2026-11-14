const { lookupStudentByEmail } = require('../services/mwsDataCenterClient');
const { buildStudentUserPayload } = require('./studentUserHelpers');

// What MTSS keeps about a student, from the record Central has.
function mapCentralStudent(centralStudent) {
    return {
        ...buildStudentUserPayload({
            email: centralStudent.email,
            name: centralStudent.full_name,
            nickname: centralStudent.nick_name,
            gender: centralStudent.gender,
            status: centralStudent.status,
            currentGrade: centralStudent.current_grade,
            className: centralStudent.current_class,
        }),
        centralPersonId: centralStudent.person_id,
    };
}

async function syncStudentFromCentral(email) {
    const centralStudent = await lookupStudentByEmail(email);
    if (!centralStudent) return null;
    return mapCentralStudent(centralStudent);
}

module.exports = { syncStudentFromCentral, mapCentralStudent };
