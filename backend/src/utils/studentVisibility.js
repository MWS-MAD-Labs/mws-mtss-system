// Who can be seen in MTSS: students Central has put in a class (status ACTIVE) and still lists. Everyone else (not yet
// in a class, left the school, no longer in Central) stays out of every list, plan and count. Nothing is deleted: the
// record and its history wait, and the student shows again when Central makes them ACTIVE.
const VISIBLE_STUDENT_FILTER = Object.freeze({ status: 'ACTIVE', orphanedAt: null });

const isVisibleStudent = (student) => Boolean(student)
    && student.status === VISIBLE_STUDENT_FILTER.status
    && !student.orphanedAt;

module.exports = { VISIBLE_STUDENT_FILTER, isVisibleStudent };
