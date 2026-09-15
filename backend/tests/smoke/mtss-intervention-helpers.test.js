const {
    normalizeInterventionDuration,
    calculateDirectionalProgress
} = require('../../src/utils/mtssIntervention');
const {
    mentorAssignmentCreateSchema,
    mentorAssignmentUpdateSchema
} = require('../../src/utils/validationSchemas');
const MentorAssignment = require('../../src/models/MentorAssignment');

describe('MTSS intervention duration contract', () => {
    test.each([
        ['2 weeks', '2 weeks'],
        ['Custom', 'Custom'],
        ['1 day', '1 day'],
        ['1 days', '1 day'],
        [' 365 DAYS ', '365 days']
    ])('normalizes %s', (input, expected) => {
        expect(normalizeInterventionDuration(input)).toBe(expected);
    });

    test.each(['0 days', '366 days', '1 week', 'daily', '', null])('rejects %s', (input) => {
        expect(normalizeInterventionDuration(input)).toBeNull();
    });

    test('Joi create and update schemas apply the shared normalization', () => {
        const createResult = mentorAssignmentCreateSchema.validate({
            mentorId: '507f1f77bcf86cd799439011',
            studentIds: ['507f191e810c19729de860ea'],
            tier: 'tier2',
            focusAreas: ['Math'],
            duration: '1 days',
            mode: 'qualitative',
            goals: [{ description: 'Build independence', completed: false }]
        });
        const updateResult = mentorAssignmentUpdateSchema.validate({ duration: '365 DAYS' });

        expect(createResult.error).toBeUndefined();
        expect(createResult.value.duration).toBe('1 day');
        expect(createResult.value.goals[0].completed).toBe(false);
        expect(updateResult.error).toBeUndefined();
        expect(updateResult.value.duration).toBe('365 days');
        expect(mentorAssignmentUpdateSchema.validate({ duration: '366 days' }).error).toBeDefined();
    });

    test('Mongoose applies the same duration contract', () => {
        const valid = new MentorAssignment({
            mentorId: '507f1f77bcf86cd799439011',
            studentIds: ['507f191e810c19729de860ea'],
            tier: 'tier2',
            focusAreas: ['Math'],
            duration: '1 days'
        });
        const invalid = new MentorAssignment({
            mentorId: '507f1f77bcf86cd799439011',
            studentIds: ['507f191e810c19729de860ea'],
            tier: 'tier2',
            focusAreas: ['Math'],
            duration: '366 days'
        });

        expect(valid.duration).toBe('1 day');
        expect(valid.validateSync()).toBeUndefined();
        expect(invalid.validateSync()?.errors?.duration).toBeDefined();
    });
});

describe('directional MTSS progress', () => {
    test('calculates progress toward a higher target', () => {
        expect(calculateDirectionalProgress({ baseline: 40, target: 80, current: 60, previous: 50 }))
            .toEqual({ percentage: 50, trend: 'improving' });
    });

    test('treats a lower score as improvement when the target is lower', () => {
        expect(calculateDirectionalProgress({ baseline: 10, target: 2, current: 6, previous: 8 }))
            .toEqual({ percentage: 50, trend: 'improving' });
    });

    test('clamps overshoot and identifies movement away from target', () => {
        expect(calculateDirectionalProgress({ baseline: 10, target: 2, current: 12, previous: 8 }))
            .toEqual({ percentage: 0, trend: 'declining' });
        expect(calculateDirectionalProgress({ baseline: 10, target: 2, current: 1, previous: 3 }).percentage)
            .toBe(100);
    });
});
