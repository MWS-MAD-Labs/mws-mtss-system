const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { migrationTargets, remapDocument } = require('../../src/utils/personMigration');

fs.readdirSync(path.join(__dirname, '../../src/models')).forEach((file) => require(`../../src/models/${file}`));

describe('migrationTargets', () => {
    const targets = migrationTargets(mongoose.models).map((t) => `${t.model}.${t.path}`);

    test.each([
        'MentorAssignment.mentorId',
        'MentorAssignment.createdBy',
        'MentorAssignment.planChangeLog.changedBy',
        'MTSSStudent.interventions.history.assignedMentor',
        'TeacherAlert.assignedTo.teacherId',
        'Notification.userId',
        'AIAssistantFeedback.userId',
        'StudentLearningTwin.userId',
    ])('%s is covered', (target) => {
        expect(targets).toContain(target);
    });

    test('a person\'s own links are left to the sync', () => {
        expect(targets.some((target) => target.startsWith('Person.'))).toBe(false);
    });
});

describe('remapDocument', () => {
    const oldA = 'a'.repeat(24);
    const oldB = 'b'.repeat(24);
    const idMap = new Map([[oldA, 'person-a'], [oldB, 'person-b']]);

    test('maps a plain field', () => {
        expect(remapDocument({ mentorId: oldA }, 'mentorId', idMap)).toEqual({ set: { mentorId: 'person-a' }, missing: [] });
    });

    test('maps a field inside an array and keeps the position', () => {
        const doc = { planChangeLog: [{ changedBy: oldA }, { changedBy: 'other' }, { changedBy: oldB }] };
        const { set, missing } = remapDocument(doc, 'planChangeLog.changedBy', idMap);
        expect(set).toEqual({ 'planChangeLog.0.changedBy': 'person-a', 'planChangeLog.2.changedBy': 'person-b' });
        expect(missing).toEqual(['other']);
    });

    test('maps through two levels of arrays', () => {
        const doc = { interventions: [{ history: [{ assignedMentor: oldB }] }] };
        expect(remapDocument(doc, 'interventions.history.assignedMentor', idMap).set)
            .toEqual({ 'interventions.0.history.0.assignedMentor': 'person-b' });
    });

    test('a second run finds nothing left to map', () => {
        expect(remapDocument({ mentorId: 'person-a' }, 'mentorId', idMap).set).toEqual({});
    });

    test('a missing field is not an error', () => {
        expect(remapDocument({}, 'tester.userId', idMap)).toEqual({ set: {}, missing: [] });
    });
});
