const { SCOPE_MODE, resolveMtssScope, isStudent } = require('../../src/utils/accessScope');
const { actorKind, ACTOR_KIND } = require('../../src/utils/actorKind');
const { requirePermission, requireAnyPermission } = require('../../src/middleware/permissionGuard');

const person = (permissions, over = {}) => ({ permissions, unit: 'Elementary', personType: 'employee', ...over });

describe('how much of MTSS one person sees', () => {
    it('shows nothing without the permission to read MTSS', () => {
        expect(resolveMtssScope(person(['mtss.scope.all'])).mode).toBe(SCOPE_MODE.NONE);
        expect(resolveMtssScope(person([])).mode).toBe(SCOPE_MODE.NONE);
        expect(resolveMtssScope(null).mode).toBe(SCOPE_MODE.NONE);
    });

    it('shows the assigned students unless a scope permission widens it', () => {
        expect(resolveMtssScope(person(['mtss.read'])).mode).toBe(SCOPE_MODE.ASSIGNED);
        expect(resolveMtssScope(person(['mtss.read', 'mtss.scope.unit']))).toEqual({ mode: SCOPE_MODE.UNIT, unit: 'Elementary' });
        expect(resolveMtssScope(person(['mtss.read', 'mtss.scope.all'])).mode).toBe(SCOPE_MODE.ALL);
        expect(resolveMtssScope(person(['mtss.read', 'mtss.scope.unit', 'mtss.scope.all'])).mode).toBe(SCOPE_MODE.ALL);
    });

    it('shows nobody for a unit scope without a unit, never everybody', () => {
        expect(resolveMtssScope(person(['mtss.read', 'mtss.scope.unit'], { unit: '', department: '' })).mode).toBe(SCOPE_MODE.NONE);
    });

    it('knows a student by what kind of person it is', () => {
        expect(isStudent({ personType: 'student' })).toBe(true);
        expect(isStudent({ personType: 'employee' })).toBe(false);
    });
});

describe('the name for a kind of person', () => {
    it('is worked out from permissions and what Central keeps, and is only a label', () => {
        expect(actorKind(person(['mtss.read', 'mtss.admin', 'mtss.scope.all']))).toBe(ACTOR_KIND.DIRECTORATE);
        expect(actorKind(person(['mtss.read', 'mtss.admin', 'mtss.scope.unit']))).toBe(ACTOR_KIND.HEAD_UNIT);
        expect(actorKind(person(['mtss.read', 'mtss.admin']))).toBe(ACTOR_KIND.ADMIN);
        expect(actorKind(person(['mtss.read'], { isTeachingRole: true, classes: [{ grade: 'Grade 4' }] }))).toBe(ACTOR_KIND.TEACHER);
        expect(actorKind(person(['mtss.read'], { isTeachingRole: true, classes: [], supportedStudentIds: ['s1'] }))).toBe(ACTOR_KIND.SE_TEACHER);
        expect(actorKind(person(['mtss.read']))).toBe(ACTOR_KIND.STAFF);
        expect(actorKind({ personType: 'student', permissions: ['mtss.admin'] })).toBe(ACTOR_KIND.STUDENT);
        expect(actorKind(null)).toBeNull();
    });
});

describe('the permission guard', () => {
    const run = (guard, user) => {
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();
        guard({ user }, res, next);
        return { res, next };
    };

    it('lets through only a person who holds the permission, and says 401 when nobody is signed in', () => {
        const guard = requirePermission('mtss.write');
        expect(run(guard, { permissions: ['mtss.write'] }).next).toHaveBeenCalled();
        const refused = run(guard, { permissions: ['mtss.read'] });
        expect(refused.next).not.toHaveBeenCalled();
        expect(refused.res.status).toHaveBeenCalledWith(403);
        expect(run(guard, undefined).res.status).toHaveBeenCalledWith(401);
    });

    it('accepts any one of several permissions, and remembers what it asks for', () => {
        const guard = requireAnyPermission('a.read', 'b.read');
        expect(guard.permissions).toEqual(['a.read', 'b.read']);
        expect(run(guard, { permissions: ['b.read'] }).next).toHaveBeenCalled();
        expect(run(guard, { permissions: [] }).next).not.toHaveBeenCalled();
    });
});
