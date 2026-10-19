const mongoose = require('mongoose');
const { plan, apply } = require('../../src/scripts/migrateToPerson');

// The move keeps each person's _id, so references elsewhere stay valid with nothing rewritten.
describe('migrate:people (keeps the _id)', () => {
    let db;
    const teacherId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const noCentralId = new mongoose.Types.ObjectId();
    const resolver = async (email) => ({ 'teacher@mig.test': 'person-t', 'kid@mig.test': 'person-k' })[email];

    const clean = async () => {
        for (const name of ['users', 'userstudents', 'people']) await db.collection(name).deleteMany({ email: /@mig\.test$/ });
    };

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
        db = mongoose.connection.db;
        await clean();
        await db.collection('users').insertMany([
            { _id: teacherId, email: 'Teacher@mig.test', name: 'Teacher', isActive: true, unit: 'Junior High', jobPosition: 'Teacher', isTeachingRole: true, classes: [{ grade: 'Grade 8', className: 'Grade 8 - A' }], createdAt: new Date('2025-01-01') },
            { _id: noCentralId, email: 'ghost@mig.test', name: 'Ghost', isActive: true },
        ]);
        await db.collection('userstudents').insertOne({ _id: studentId, email: 'kid@mig.test', name: 'Kid', isActive: true, status: 'ACTIVE', currentGrade: 'Grade 8', className: 'Grade 8 - A' });
    });
    afterAll(async () => {
        await clean();
        await mongoose.disconnect();
    });

    test('plans one person per old account that Central knows, with the same _id', async () => {
        const result = await plan(db, { resolvePersonId: resolver });
        const ids = result.create.map((person) => String(person._id)).sort();
        expect(ids).toEqual([String(teacherId), String(studentId)].sort());
        const teacher = result.create.find((person) => String(person._id) === String(teacherId));
        expect(teacher).toMatchObject({ email: 'teacher@mig.test', centralPersonId: 'person-t', personType: 'employee', centralStatus: 'no_access', isTeachingRole: true });
        expect(teacher.classes).toHaveLength(1);
        expect(teacher.createdAt).toEqual(new Date('2025-01-01'));
    });

    test('an account Central does not know is listed for review and not moved', async () => {
        const result = await plan(db, { resolvePersonId: resolver });
        expect(result.needsReview.map((row) => row.email)).toEqual(['ghost@mig.test']);
    });

    test('nothing is written by planning, and applying twice writes once', async () => {
        expect(await db.collection('people').countDocuments({ email: /@mig\.test$/ })).toBe(0);
        const first = await plan(db, { resolvePersonId: resolver });
        expect(await apply(db, first.create)).toBe(2);
        const second = await plan(db, { resolvePersonId: resolver });
        expect(second.create).toEqual([]);
        expect(second.alreadyThere).toBe(2);
        expect(await db.collection('people').findOne({ _id: teacherId })).toMatchObject({ centralPersonId: 'person-t' });
    });

    test('a person the Central sync already made under another id is a duplicate, not overwritten', async () => {
        await db.collection('users').insertOne({ _id: new mongoose.Types.ObjectId(), email: 'sync-first@mig.test', name: 'Early', isActive: true });
        await db.collection('people').insertOne({ _id: new mongoose.Types.ObjectId(), email: 'sync-first@mig.test', centralPersonId: 'person-s', name: 'Early', personType: 'employee' });
        const result = await plan(db, { resolvePersonId: async (email) => (email === 'sync-first@mig.test' ? 'person-s' : undefined) });
        expect(result.duplicates.map((row) => row.email)).toEqual(['sync-first@mig.test']);
    });
});
