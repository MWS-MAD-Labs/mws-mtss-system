const {
    subjectKeysForConflict,
    extractConflictSubjectKeys
} = require('../../src/controllers/mtssController');

describe('the subject of an intervention for the one-per-subject rule', () => {
    it('knows the six subjects of the form, whatever the case', () => {
        expect(subjectKeysForConflict('SEL')).toEqual(['sel']);
        expect(subjectKeysForConflict('English')).toEqual(['english']);
        expect(subjectKeysForConflict('MATH')).toEqual(['math']);
        expect(subjectKeysForConflict('behavior')).toEqual(['behavior']);
        expect(subjectKeysForConflict('Attendance')).toEqual(['attendance']);
        expect(subjectKeysForConflict('Bahasa Indonesia')).toEqual(['indonesian']);
    });

    it('keeps SEL and Behavior apart, as the form does', () => {
        expect(subjectKeysForConflict('SEL')).not.toEqual(subjectKeysForConflict('Behavior'));
    });

    it('does not take Bahasa Inggris for Bahasa Indonesia', () => {
        expect(subjectKeysForConflict('Bahasa Inggris')).toEqual(['english']);
    });

    it('matches whole words only, so a short alias does not match inside another word', () => {
        expect(subjectKeysForConflict('Binder organisation')).toEqual(['binder-organisation']);
        expect(subjectKeysForConflict('Self regulation')).toEqual(['self-regulation']);
    });

    it('finds the subject in a longer label, and both when a label names two', () => {
        expect(subjectKeysForConflict('English reading fluency')).toEqual(['english']);
        expect(subjectKeysForConflict('Math and reading').sort()).toEqual(['english', 'math']);
    });

    it('counts an unknown subject as its own, and Universal as none', () => {
        expect(subjectKeysForConflict('Handwriting')).toEqual(['handwriting']);
        expect(subjectKeysForConflict('Universal Supports')).toEqual([]);
        expect(subjectKeysForConflict('')).toEqual([]);
    });
});

describe('the subjects of an assignment', () => {
    it('comes from the focus areas only, not from the name of the strategy', () => {
        expect(
            extractConflictSubjectKeys({ focusAreas: ['Math'], strategyName: 'Reading Fluency Practice' })
        ).toEqual(['math']);
    });

    it('is empty for an assignment with no subject, so two of them do not block each other', () => {
        expect(extractConflictSubjectKeys({ focusAreas: ['Universal Supports'] })).toEqual([]);
        expect(extractConflictSubjectKeys({})).toEqual([]);
    });

    it('lists every subject once', () => {
        expect(extractConflictSubjectKeys({ focusAreas: ['Math', 'mathematics', 'English'] }).sort()).toEqual(['english', 'math']);
    });
});
