const { SCOPE_MODE } = require('./accessScope');
const { deriveGradesForUnit, normalizeGradeLabel } = require('./mtssAccess');

// Whether a viewer's MTSS scope reaches this student without needing an intervention of their own. Everyone in
// reach (all students) or in their unit's grades is; anyone else must be a mentor of the student (checked by the caller).
const studentInViewerScope = (viewer = {}, student = {}) => {
    const scope = viewer?.mtssScope || { mode: SCOPE_MODE.NONE };
    if (scope.mode === SCOPE_MODE.ALL) return true;
    if (scope.mode !== SCOPE_MODE.UNIT) return false;
    const unitGrades = deriveGradesForUnit(scope.unit).map(normalizeGradeLabel);
    const grade = normalizeGradeLabel(student.currentGrade || student.grade || '');
    return Boolean(grade) && unitGrades.includes(grade);
};

module.exports = { studentInViewerScope };
