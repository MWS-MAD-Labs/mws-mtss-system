const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../../src/jobs/mtssStudentRosterSync', () => ({
    syncStudentRoster: jest.fn(),
}));
jest.mock('../../src/jobs/teacherClassAssignmentSync', () => ({
    syncTeacherClassAssignments: jest.fn(),
}));
jest.mock('../../src/jobs/studentSupportAssignmentSync', () => ({
    syncStudentSupportAssignments: jest.fn(),
}));
jest.mock('../../src/jobs/employeeDeactivationSync', () => ({
    deactivateMissingEmployees: jest.fn(),
}));
jest.mock('../../src/jobs/studentDeactivationSync', () => ({
    deactivateMissingStudents: jest.fn(),
}));

const { app } = require('../../src/app');
const User = require('../../src/models/User');
const SyncStatus = require('../../src/models/SyncStatus');
const { syncStudentRoster } = require('../../src/jobs/mtssStudentRosterSync');
const { syncTeacherClassAssignments } = require('../../src/jobs/teacherClassAssignmentSync');
const { syncStudentSupportAssignments } = require('../../src/jobs/studentSupportAssignmentSync');
const { deactivateMissingEmployees } = require('../../src/jobs/employeeDeactivationSync');
const { deactivateMissingStudents } = require('../../src/jobs/studentDeactivationSync');

describe('Manual Sync Now endpoints', () => {
    let agent;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await User.deleteMany({});
        await SyncStatus.deleteMany({});

        syncStudentRoster.mockResolvedValue({ created: 1, updated: 2, errors: 0, orphaned: 0, unorphaned: 0, skipped: false });
        syncTeacherClassAssignments.mockResolvedValue({ checked: 5, updated: 1, skipped: false });
        syncStudentSupportAssignments.mockResolvedValue({ checked: 3, updated: 0, skipped: false });
        deactivateMissingEmployees.mockResolvedValue({ checked: 4, deactivated: 0, roleDriftDetected: 0, skipped: false });
        deactivateMissingStudents.mockResolvedValue({ checked: 6, deactivated: 1, skipped: false });

        await User.create({
            email: 'sync-test@school.com',
            password: 'password123',
            name: 'Sync Test User',
            role: 'staff',
        });
        // /auth is a sibling top-level mount to /api (app.js), and the
        // session lives in an httpOnly cookie set on the login response -
        // request.agent keeps and resends it automatically, like a real
        // browser session would.
        agent = request.agent(app);
        await agent.post('/auth/login').send({ email: 'sync-test@school.com', password: 'password123' });
    });

    it('reports no run yet when nobody has ever triggered a sync', async () => {
        const response = await agent.get('/api/v1/sync/status');
        expect(response.status).toBe(200);
        expect(response.body.data.isRunning).toBe(false);
        expect(response.body.data.lastTriggeredAt).toBeNull();
        expect(response.body.data.cooldownRemainingSeconds).toBe(0);
    });

    it('rejects an unauthenticated status/trigger call', async () => {
        const status = await request(app).get('/api/v1/sync/status');
        expect(status.status).toBe(401);
        const trigger = await request(app).post('/api/v1/sync/trigger');
        expect(trigger.status).toBe(401);
    });

    it('runs every sync/deactivation job and reports a merged result on trigger', async () => {
        const response = await agent.post('/api/v1/sync/trigger');

        expect(response.status).toBe(200);
        expect(syncStudentRoster).toHaveBeenCalledTimes(1);
        expect(syncTeacherClassAssignments).toHaveBeenCalledTimes(1);
        expect(syncStudentSupportAssignments).toHaveBeenCalledTimes(1);
        expect(deactivateMissingEmployees).toHaveBeenCalledTimes(1);
        expect(deactivateMissingStudents).toHaveBeenCalledTimes(1);
        expect(response.body.data.lastResult.studentRoster.updated).toBe(2);
        expect(response.body.data.lastResult.studentDeactivation.deactivated).toBe(1);
        expect(response.body.data.lastTriggeredBy).toBe('sync-test@school.com');
        expect(response.body.data.cooldownRemainingSeconds).toBeGreaterThan(0);
    });

    it('rejects a second trigger within the cooldown window without running the jobs again', async () => {
        await agent.post('/api/v1/sync/trigger');
        jest.clearAllMocks();

        const response = await agent.post('/api/v1/sync/trigger');

        expect(response.status).toBe(429);
        expect(syncStudentRoster).not.toHaveBeenCalled();
        expect(response.body.errors.cooldownRemainingSeconds).toBeGreaterThan(0);
    });

    it('collapses two near-simultaneous triggers into a single real run', async () => {
        const [first, second] = await Promise.all([
            agent.post('/api/v1/sync/trigger'),
            agent.post('/api/v1/sync/trigger'),
        ]);

        const statuses = [first.status, second.status].sort();
        expect(statuses).toEqual([200, 429]);
        expect(syncStudentRoster).toHaveBeenCalledTimes(1);
    });
});
