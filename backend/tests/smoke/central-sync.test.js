const mongoose = require('mongoose');
const Person = require('../../src/models/Person');
const MTSSStudent = require('../../src/models/MTSSStudent');
const CentralSyncState = require('../../src/models/CentralSyncState');
const { runSync, syncAccess, syncProfiles, syncIntervalMs } = require('../../src/jobs/centralSync');

const row = (over = {}) => ({
    id: 'ent-1',
    person_id: 'p-1',
    organization_id: 'org-test',
    role: 'TEACHER',
    permissions: ['users.read', 'sync.read'],
    version: 1,
    person: { full_name: 'Teacher One', email: 'one@sync-test.id' },
    ...over,
});
const employee = (over = {}) => ({
    person_id: 'p-1', email: 'one@sync-test.id', full_name: 'Teacher One', employee_id: '01.01.001',
    job_level: 'Teacher', job_position: 'Math Teacher', unit: 'Elementary', employment_type: 'PERMANENT', gender: 'MALE',
    is_teaching_role: true, ...over,
});
const student = (over = {}) => ({
    person_id: 'p-2', email: 'kid@sync-test.id', full_name: 'Kid One', nick_name: 'Kid', gender: 'FEMALE',
    status: 'ACTIVE', current_grade: 'Grade 4', current_class: 'Orion', ...over,
});
const fakeApi = (over = {}) => ({
    getApplicationEntitlementKey: jest.fn().mockResolvedValue('key-1'),
    listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [row()], key: 'key-1' }),
    lookupEmployeeByPersonId: jest.fn().mockResolvedValue(employee()),
    lookupStudentByEmail: jest.fn().mockResolvedValue(null),
    listActiveEmployees: jest.fn().mockResolvedValue([employee()]),
    listStudentsByStatus: jest.fn().mockResolvedValue([]),
    listClassTeacherAssignments: jest.fn().mockResolvedValue([]),
    listStudentSupportAssignments: jest.fn().mockResolvedValue([]),
    ...over,
});

describe('sync with Central', () => {
    beforeAll(async () => {
        process.env.CENTRAL_ORGANIZATION_ID = 'org-test';
        await mongoose.connect(process.env.MONGODB_URI);
    });
    afterAll(async () => {
        await Person.deleteMany({ email: /@sync-test\.id$/ });
        await CentralSyncState.deleteMany({});
        await mongoose.connection.close();
    });
    beforeEach(async () => {
        process.env.CENTRAL_ORGANIZATION_ID = 'org-test';
        await Person.deleteMany({ email: /@sync-test\.id$/ });
        await CentralSyncState.deleteMany({});
    });

    it('makes people Central lists even if they never signed in', async () => {
        const { summary } = await syncAccess(fakeApi());
        expect(summary).toMatchObject({ created: 1, updated: 0, revoked: 0 });
        const person = await Person.findOne({ centralPersonId: 'p-1' });
        expect(person).toMatchObject({ personType: 'employee', unit: 'Elementary', jobLevel: 'Teacher', isTeachingRole: true, centralStatus: 'active' });
        expect(person.centralEntitlementPermissions).toEqual(['sync.read', 'users.read']);
    });

    it('makes a student a person of the student kind', async () => {
        const api = fakeApi({
            listApplicationEntitlements: jest.fn().mockResolvedValue({
                rows: [row({ id: 'ent-2', person_id: 'p-2', role: 'STUDENT', person: { full_name: 'Kid One', email: 'kid@sync-test.id' } })],
                key: 'key-1',
            }),
            lookupEmployeeByPersonId: jest.fn().mockResolvedValue(null),
            lookupStudentByEmail: jest.fn().mockResolvedValue(student()),
        });
        await syncAccess(api);
        const person = await Person.findOne({ centralPersonId: 'p-2' });
        expect(person).toMatchObject({ personType: 'student', currentGrade: 'Grade 4', className: 'Orion', nickname: 'Kid' });
    });

    it('updates a changed role, leaves an unchanged one, and revokes who Central no longer lists', async () => {
        await syncAccess(fakeApi());
        const same = await syncAccess(fakeApi());
        expect(same.summary).toMatchObject({ created: 0, updated: 0, unchanged: 1 });

        const changed = await syncAccess(fakeApi({ listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [row({ version: 2, permissions: ['users.read'] })], key: 'key-2' }) }));
        expect(changed.summary.updated).toBe(1);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).centralEntitlementPermissions).toEqual(['users.read']);

        const gone = await syncAccess(fakeApi({ listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [], key: 'key-3' }) }));
        expect(gone.summary.revoked).toBe(1);
        const revoked = await Person.findOne({ centralPersonId: 'p-1' });
        expect(revoked.centralStatus).toBe('no_access');
        expect(revoked.centralEntitlementPermissions).toEqual([]);
    });

    it('counts somebody Central lists but knows as neither employee nor student, and makes no record', async () => {
        const { summary } = await syncAccess(fakeApi({ lookupEmployeeByPersonId: jest.fn().mockResolvedValue(null) }));
        expect(summary.unmapped).toBe(1);
        expect(await Person.countDocuments({ email: /@sync-test\.id$/ })).toBe(0);
    });

    it('skips an entitlement of another organization', async () => {
        const { summary } = await syncAccess(fakeApi({ listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [row({ organization_id: 'other' })], key: 'key-1' }) }));
        expect(summary).toMatchObject({ created: 0, invalid: 1 });
    });

    it('reads the full list only when the key moved', async () => {
        const api = fakeApi();
        const first = await runSync({ api, now: new Date('2026-10-15T10:00:00Z') });
        expect(first.status).toBe('synced');
        expect(api.listApplicationEntitlements).toHaveBeenCalledTimes(1);

        const second = await runSync({ api, now: new Date('2026-10-15T10:01:00Z') });
        expect(second.status).toBe('unchanged');
        expect(api.listApplicationEntitlements).toHaveBeenCalledTimes(1);

        api.getApplicationEntitlementKey.mockResolvedValue('key-2');
        const third = await runSync({ api, now: new Date('2026-10-15T10:02:00Z') });
        expect(third.status).toBe('synced');
        expect(api.listApplicationEntitlements).toHaveBeenCalledTimes(2);
    });

    it('lets only one instance sync at a time', async () => {
        const slow = fakeApi({ getApplicationEntitlementKey: jest.fn(() => new Promise((resolve) => setTimeout(() => resolve('key-1'), 150))) });
        const now = new Date();
        const [a, b] = await Promise.all([runSync({ api: slow, now }), runSync({ api: fakeApi(), now })]);
        expect([a.status, b.status]).toContain('locked');
    });

    it('records the error and releases the lease when Central cannot be asked', async () => {
        const down = fakeApi({ getApplicationEntitlementKey: jest.fn().mockRejectedValue(new Error('Central is down')) });
        const result = await runSync({ api: down });
        expect(result).toMatchObject({ status: 'error', message: 'Central is down' });
        const state = await CentralSyncState.findById('mtss');
        expect(state.lastError).toBe('Central is down');
        expect(state.lockedUntil).toBeNull();
    });

    it('copies unit and job from the profile lists, and deactivates who is gone', async () => {
        await syncAccess(fakeApi());
        const result = await syncProfiles(fakeApi({ listActiveEmployees: jest.fn().mockResolvedValue([employee({ unit: 'Junior High' })]) }));
        expect(result.updated).toBe(1);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).unit).toBe('Junior High');

        const gone = await syncProfiles(fakeApi({ listActiveEmployees: jest.fn().mockResolvedValue([]) }));
        expect(gone.deactivated).toBe(1);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).isActive).toBe(false);
    });

    it('keeps the classes a teacher teaches and the students a special education teacher supports', async () => {
        await syncAccess(fakeApi());
        const kid = await MTSSStudent.create({ name: 'Kid One', email: 'kid@sync-test.id', status: 'ACTIVE', currentGrade: 'Grade 4' });
        try {
            const api = fakeApi({
                listClassTeacherAssignments: jest.fn().mockResolvedValue([
                    { employee_email: 'one@sync-test.id', grade_name: 'Grade 4', additional_grade_names: ['Grade 5'], class_name: 'Orion', role: 'HOMEROOM' },
                ]),
                listStudentSupportAssignments: jest.fn().mockResolvedValue([
                    { employee_email: 'one@sync-test.id', student_email: 'kid@sync-test.id' },
                ]),
            });
            const first = await syncProfiles(api);
            expect(first.updated).toBe(1);
            const person = await Person.findOne({ centralPersonId: 'p-1' });
            expect(person.classes.map((c) => `${c.grade}|${c.className}|${c.role}`).sort()).toEqual(['Grade 4|Orion|Homeroom Teacher', 'Grade 5|Orion|Homeroom Teacher']);
            expect(person.supportedStudentIds.map(String)).toEqual([String(kid._id)]);

            // Nothing changed in Central: nothing written.
            expect((await syncProfiles(api)).updated).toBe(0);

            // Central takes the class away: it is cleared.
            const cleared = await syncProfiles(fakeApi({ listStudentSupportAssignments: api.listStudentSupportAssignments }));
            expect(cleared.updated).toBe(1);
            expect((await Person.findOne({ centralPersonId: 'p-1' })).classes).toHaveLength(0);
        } finally {
            await MTSSStudent.deleteOne({ _id: kid._id });
        }
    });

    it('leaves classes and supported students alone when their list could not be read', async () => {
        await syncAccess(fakeApi());
        await Person.updateOne({ centralPersonId: 'p-1' }, { classes: [{ grade: 'Grade 4', className: 'Orion', role: 'Homeroom Teacher' }] });
        const result = await syncProfiles(fakeApi({
            listClassTeacherAssignments: jest.fn().mockRejectedValue(new Error('page 2 failed')),
            listStudentSupportAssignments: jest.fn().mockRejectedValue(new Error('timeout')),
        }));
        expect(result.warnings).toEqual(['Class assignments skipped: page 2 failed', 'Student support assignments skipped: timeout']);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).classes).toHaveLength(1);
    });

    it('never deactivates anyone when a list could not be read in full', async () => {
        await syncAccess(fakeApi());
        const result = await syncProfiles(fakeApi({ listActiveEmployees: jest.fn().mockRejectedValue(new Error('page 2 failed')) }));
        expect(result.warnings).toEqual(['Employees skipped: page 2 failed']);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).isActive).toBe(true);
    });

    it('keeps going when Central refuses one lookup, and names the scope the token lacks', async () => {
        const refused = Object.assign(new Error('Request failed with status code 403'), {
            response: { status: 403, data: { message: "Forbidden: missing required scope 'students:read'" } },
        });
        const api = fakeApi({
            listApplicationEntitlements: jest.fn().mockResolvedValue({
                rows: [row(), row({ id: 'ent-2', person_id: 'p-2', role: 'STUDENT', person: { full_name: 'Kid', email: 'kid@sync-test.id' } })],
                key: 'key-1',
            }),
            lookupEmployeeByPersonId: jest.fn((id) => Promise.resolve(id === 'p-1' ? employee() : null)),
            lookupStudentByEmail: jest.fn().mockRejectedValue(refused),
        });
        const { summary, warnings } = await syncAccess(api);
        expect(summary).toMatchObject({ created: 1, unmapped: 1 });
        expect(warnings).toEqual(["MTSS's API token is missing the scope students:read"]);
    });

    it('reads the interval from the .env, never faster than every 15 seconds, and 0 turns it off', () => {
        expect(syncIntervalMs(undefined)).toBe(60000);
        expect(syncIntervalMs('30')).toBe(30000);
        expect(syncIntervalMs('5')).toBe(15000);
        expect(syncIntervalMs('0')).toBe(0);
        expect(syncIntervalMs('abc')).toBe(60000);
    });
});
