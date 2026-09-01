const { buildGradeFilterClauses, deriveAllowedGradesForUser } = require('../../src/utils/mtssAccess');
const { parseAssignmentLabel } = require('../../src/scripts/data/classAssignments');

// A per-name allowlist ("himawan", "hasan") used to sit in
// mtssController.js / mtssStudentController.js to give two specific Junior
// High subject specialists grade-wide roster access. It was dead code: the
// general path (deriveAllowedGradesForUser -> buildGradeFilterClauses)
// already expands a bare "Junior High" grade label into Grade 7/8/9 via
// deriveGradesForUnit, producing byte-identical filters. Proven here for
// every JH "<subject>, no grade number" teacher in classAssignments.js,
// including "Hadi" (Performing Arts) - who was never added to the old
// allowlist and so was silently broken by it until this fix.
describe('JH subject teachers with no grade number in their class label', () => {
    const cases = [
        ['Junior High - Coding', 'Himawan Rizky Syaputra'],
        ['Junior High - Makerspace', 'Nayandra Hasan Sudra'],
        ['Junior High - Performing Arts', 'Hadi'],
    ];

    test.each(cases)('label "%s" (%s) resolves to all of Grade 7/8/9 with no name-based handling', (label, name) => {
        const parsed = parseAssignmentLabel(label, '');
        const teacher = {
            unit: 'Junior High',
            classes: [parsed],
            jobPosition: `${label.split(' - ')[1]} Teacher`,
            name,
        };

        const allowedGrades = deriveAllowedGradesForUser(teacher);
        const clauses = buildGradeFilterClauses(allowedGrades).map((c) => c.currentGrade.source);
        const matches = (grade) => clauses.some((source) => new RegExp(source, 'i').test(grade));

        expect(matches('Grade 7')).toBe(true);
        expect(matches('Grade 8')).toBe(true);
        expect(matches('Grade 9')).toBe(true);
    });
});
