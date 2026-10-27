const { buildMtssAccessProfile, isMtssCoordinator } = require('../../src/utils/accessControl');
const { studentInGradeScope } = require('../../src/utils/mtssAccess');
const { applyViewerScope } = require('../../src/controllers/mtssStudentController');
const { canViewerSeeAssignment } = require('../../src/controllers/mtssController');
const { buildRequestUser, coordinatorMayCall } = require('../../src/middleware/auth');
const User = require('../../src/models/User');
const { COORDINATORS, applyCoordinators } = require('../../src/scripts/seedMtssCoordinators');

const LOWER = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'];
const UPPER = ['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];

const coordinatorUser = (gradeScope, role = 'teacher') => ({
    email: 'someone@millennia21.id',
    role,
    mtssAccess: { enabled: true, accessLevel: 'coordinator', gradeScope }
});

describe('Coordinator access profile', () => {
    test('is read-only, not an admin, and carries its grades', () => {
        const profile = buildMtssAccessProfile(coordinatorUser(LOWER));
        expect(profile).toMatchObject({
            hasAccess: true,
            isReadOnly: true,
            canAccessAdmin: false,
            canManageConfig: false,
            accessLevel: 'coordinator',
            effectiveRole: 'coordinator',
            source: 'user_override'
        });
        expect(profile.gradeScope).toEqual(LOWER);
    });

    test('wins over a higher role and still cannot write', () => {
        const profile = buildMtssAccessProfile(coordinatorUser(UPPER, 'directorate'));
        expect(profile.isReadOnly).toBe(true);
        expect(profile.canAccessAdmin).toBe(false);
    });

    test('a teacher without the override is unchanged', () => {
        const profile = buildMtssAccessProfile({ email: 'teacher@millennia21.id', role: 'teacher' });
        expect(profile.accessLevel).toBe('teacher');
        expect(profile.isReadOnly).toBe(false);
        expect(profile.gradeScope).toBeUndefined();
    });

    test('is switched off by enabled false, and an unknown level falls back to observer', () => {
        expect(buildMtssAccessProfile({ role: 'teacher', mtssAccess: { enabled: false, accessLevel: 'coordinator', gradeScope: LOWER } }).hasAccess).toBe(false);
        expect(buildMtssAccessProfile({ role: 'teacher', mtssAccess: { enabled: true, accessLevel: 'nonsense' } }).accessLevel).toBe('observer');
    });

    test('the request user carries the profile', () => {
        const requestUser = buildRequestUser({ _id: 'u1', email: 'a@millennia21.id', role: 'teacher', mtssAccess: coordinatorUser(LOWER).mtssAccess });
        expect(isMtssCoordinator(requestUser)).toBe(true);
        expect(requestUser.mtssAccess.gradeScope).toEqual(LOWER);
    });
});

describe('Coordinator grades', () => {
    const inScope = (grade, scope) => studentInGradeScope({ currentGrade: grade }, scope);

    test('Lower scope: Kindergarten in every form and Grade 1 to 3, nothing else', () => {
        ['Kindergarten', 'Kindergarten Pre-K', 'Kindergarten K1', 'Kindergarten K2 - Bear Paw', 'Grade 1', 'Grade 2 - Centaurus', 'Grade 3'].forEach((grade) => {
            expect([grade, inScope(grade, LOWER)]).toEqual([grade, true]);
        });
        ['Grade 4', 'Grade 6', 'Grade 7 - Helix', 'Grade 9'].forEach((grade) => {
            expect([grade, inScope(grade, LOWER)]).toEqual([grade, false]);
        });
    });

    test('Upper scope: Grade 4 to 9 including the Junior High class names, nothing below', () => {
        ['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7 - Helix', 'Grade 8 - Cartwheel', 'Grade 9 - Messier 87'].forEach((grade) => {
            expect([grade, inScope(grade, UPPER)]).toEqual([grade, true]);
        });
        ['Kindergarten K2', 'Grade 1', 'Grade 3'].forEach((grade) => {
            expect([grade, inScope(grade, UPPER)]).toEqual([grade, false]);
        });
    });

    test('an empty scope or a student without a grade matches nobody', () => {
        expect(studentInGradeScope({ currentGrade: 'Grade 1' }, [])).toBe(false);
        expect(studentInGradeScope({}, LOWER)).toBe(false);
    });
});

describe('Coordinator student scope', () => {
    test('is cut to the grades, even when the account carries a role that sees everyone', () => {
        const filter = applyViewerScope({}, buildRequestUser({ _id: 'u1', email: 'a@millennia21.id', role: 'admin', mtssAccess: coordinatorUser(UPPER, 'admin').mtssAccess }));
        expect(filter.$and).toHaveLength(1);
        expect(filter.$and[0].$or.length).toBeGreaterThan(0);
        expect(filter.$and[0].$or.every((clause) => clause.currentGrade instanceof RegExp)).toBe(true);
        const grades = ['Grade 4', 'Grade 7 - Helix', 'Grade 2'];
        const matched = grades.filter((grade) => filter.$and[0].$or.some((clause) => clause.currentGrade.test(grade)));
        expect(matched).toEqual(['Grade 4', 'Grade 7 - Helix']);
    });

    test('no grades means no students', () => {
        const filter = applyViewerScope({}, buildRequestUser({ _id: 'u1', email: 'a@millennia21.id', role: 'teacher', mtssAccess: coordinatorUser([]).mtssAccess }));
        expect(filter.$and).toEqual([{ _id: null }]);
    });
});

describe('Coordinator and mentor plans', () => {
    const viewer = buildRequestUser({ _id: 'u1', email: 'a@millennia21.id', role: 'teacher', mtssAccess: coordinatorUser(LOWER).mtssAccess });

    test('sees a plan when one of its students is in their grades', () => {
        expect(canViewerSeeAssignment({ viewer, assignment: {}, students: [{ currentGrade: 'Grade 8' }, { currentGrade: 'Grade 2' }] })).toBe(true);
    });

    test('does not see a plan whose students are all in other grades', () => {
        expect(canViewerSeeAssignment({ viewer, assignment: {}, students: [{ currentGrade: 'Grade 8' }, { currentGrade: 'Grade 5' }] })).toBe(false);
        expect(canViewerSeeAssignment({ viewer, assignment: {}, students: [] })).toBe(false);
    });
});

describe('Coordinator may only read MTSS data', () => {
    const call = (method, originalUrl) => coordinatorMayCall({ method, originalUrl });

    test('reads of MTSS data and notifications are open', () => {
        expect(call('GET', '/api/v1/mtss/students?limit=500')).toBe(true);
        expect(call('GET', '/api/v1/mtss/mentor-assignments')).toBe(true);
        expect(call('GET', '/api/v1/notifications')).toBe(true);
    });

    test('every write is closed, wherever it goes', () => {
        ['POST', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
            expect([method, call(method, '/api/v1/mtss/students')]).toEqual([method, false]);
            expect([method, call(method, '/api/v1/mtss/pilot-feedback')]).toEqual([method, false]);
            expect([method, call(method, '/api/v1/ai-insights/alerts/1/resolve')]).toEqual([method, false]);
            expect([method, call(method, '/api/v1/notifications/read')]).toEqual([method, false]);
        });
    });

    test('the AI helpers, the user list and sync are closed even to reads', () => {
        ['/api/v1/ai-chat/message', '/api/v1/ai-insights/alerts', '/api/v1/users', '/api/v1/sync/status', '/api/v1/dev/topology'].forEach((url) => {
            expect([url, call('GET', url)]).toEqual([url, false]);
        });
    });

    test('signing in and out still works', () => {
        expect(call('GET', '/api/v1/auth/me')).toBe(true);
        expect(call('POST', '/api/v1/auth/logout')).toBe(true);
    });
});

describe('seed of the Coordinators', () => {
    const fakeUser = (mtssAccess) => ({ mtssAccess, save: jest.fn().mockResolvedValue() });
    afterEach(() => jest.restoreAllMocks());

    test('the three accounts get the agreed grades', () => {
        const byEmail = Object.fromEntries(COORDINATORS.map((entry) => [entry.email, entry.gradeScope]));
        expect(byEmail['putri.fitriyani@millennia21.id']).toEqual(LOWER);
        expect(byEmail['roma@millennia21.id']).toEqual(UPPER);
        expect(byEmail['dummyteacher@millennia21.id']).toEqual(LOWER);
    });

    test('one user that cannot be saved is reported and the others are still granted', async () => {
        const broken = { mtssAccess: undefined, save: jest.fn().mockRejectedValue(new Error('User validation failed: gender')) };
        const fine = fakeUser(undefined);
        jest.spyOn(User, 'findOne').mockImplementation(async ({ email }) => (email === 'putri.fitriyani@millennia21.id' ? broken : email === 'roma@millennia21.id' ? fine : null));
        const results = await applyCoordinators();
        expect(results.find((row) => row.email === 'putri.fitriyani@millennia21.id')).toMatchObject({ status: 'failed', message: 'User validation failed: gender' });
        expect(results.find((row) => row.email === 'roma@millennia21.id').status).toBe('updated');
        expect(fine.save).toHaveBeenCalledTimes(1);
    });

    test('writes the override, reports what is missing, and is safe to run again', async () => {
        const stored = {
            'putri.fitriyani@millennia21.id': fakeUser(undefined),
            'roma@millennia21.id': fakeUser({ enabled: true, accessLevel: 'coordinator', gradeScope: UPPER })
        };
        jest.spyOn(User, 'findOne').mockImplementation(async ({ email }) => stored[email] || null);

        const dry = await applyCoordinators({ dryRun: true });
        expect(dry.map((row) => [row.email, row.status])).toEqual([
            ['putri.fitriyani@millennia21.id', 'updated'],
            ['roma@millennia21.id', 'unchanged'],
            ['dummyteacher@millennia21.id', 'not_found']
        ]);
        expect(stored['putri.fitriyani@millennia21.id'].save).not.toHaveBeenCalled();

        await applyCoordinators();
        const putri = stored['putri.fitriyani@millennia21.id'];
        expect(putri.save).toHaveBeenCalledTimes(1);
        expect(putri.mtssAccess).toMatchObject({ enabled: true, accessLevel: 'coordinator', gradeScope: LOWER });
        expect(stored['roma@millennia21.id'].save).not.toHaveBeenCalled();
        // Only the access field is validated, so an old value elsewhere on the user cannot block the grant.
        expect(putri.save).toHaveBeenCalledWith({ validateModifiedOnly: true });

        const again = await applyCoordinators();
        expect(again.find((row) => row.email === 'putri.fitriyani@millennia21.id').status).toBe('unchanged');
        expect(putri.save).toHaveBeenCalledTimes(1);
    });
});
