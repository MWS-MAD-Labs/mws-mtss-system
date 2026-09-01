const { isPilotFeedbackAdmin, PILOT_FEEDBACK_ADMIN_EMAILS } = require('../../src/utils/pilotFeedbackAccess');

describe('isPilotFeedbackAdmin', () => {
    test('matches an allowlisted email', () => {
        expect(isPilotFeedbackAdmin('faisal@millennia21.id')).toBe(true);
    });

    test('is case-insensitive and trims whitespace', () => {
        expect(isPilotFeedbackAdmin(' Faisal@Millennia21.ID ')).toBe(true);
    });

    test('rejects anyone not on the list', () => {
        expect(isPilotFeedbackAdmin('someone-else@millennia21.id')).toBe(false);
        expect(isPilotFeedbackAdmin('')).toBe(false);
        expect(isPilotFeedbackAdmin(undefined)).toBe(false);
    });

    test('PILOT_FEEDBACK_ADMIN_EMAILS is exported as a Set (one source, not duplicated per caller)', () => {
        expect(PILOT_FEEDBACK_ADMIN_EMAILS).toBeInstanceOf(Set);
    });
});
