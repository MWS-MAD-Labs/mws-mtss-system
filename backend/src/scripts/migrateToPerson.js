// One-time move from the two old user collections (users for employees, userstudents for students) to the single
// people collection. Each person keeps the _id they had, so every reference in plans, check-ins and notifications
// stays valid. The old collections are not touched, so going back is deploying the old code.
//
// The old MTSS accounts never kept Central's person id, so it is asked of Central by email (read only). An account
// Central does not know is listed as "needs review" and not moved. Run this BEFORE the first start of the new version:
// once the Central sync has made a person with a new id, that email counts as a duplicate here and its old references
// need `npm run migrate:people:refs` instead.
//
// Safe to run again: a person who already exists in people is left as it is, so a later sync is never overwritten.
// Dry-run by default (prints, writes nothing).
//
// Usage:
//   node src/scripts/migrateToPerson.js                dry-run
//   node src/scripts/migrateToPerson.js --apply        writes
//   node src/scripts/migrateToPerson.js --no-resolve   do not ask Central for the person id (nothing without one moves)
require('dotenv').config();
const mongoose = require('mongoose');
const { PERSON_TYPE, CENTRAL_STATUS } = require('../constants/person');

const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const common = (doc, personType, centralPersonId) => ({
    _id: doc._id,
    centralPersonId,
    email: String(doc.email).trim().toLowerCase(),
    name: doc.name,
    username: text(doc.username),
    nickname: text(doc.nickname),
    gender: doc.gender,
    personType,
    isActive: doc.isActive !== false,
    // Nothing is granted until the first sync with Central says so.
    centralStatus: CENTRAL_STATUS.NO_ACCESS,
    lastLogin: doc.lastLogin,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

function personFromEmployee(doc, centralPersonId = doc.centralPersonId) {
    return {
        ...common(doc, PERSON_TYPE.EMPLOYEE, centralPersonId),
        employeeId: text(doc.employeeId),
        department: text(doc.department),
        unit: text(doc.unit),
        jobLevel: text(doc.jobLevel),
        jobPosition: text(doc.jobPosition),
        isTeachingRole: Boolean(doc.isTeachingRole),
        employmentStatus: doc.employmentStatus,
        joinDate: doc.joinDate,
        endDate: doc.endDate,
        classes: doc.classes || [],
        supportedStudentIds: doc.supportedStudentIds || [],
    };
}

function personFromStudent(doc, centralPersonId = doc.centralPersonId) {
    return {
        ...common(doc, PERSON_TYPE.STUDENT, centralPersonId),
        status: doc.status,
        currentGrade: text(doc.currentGrade),
        className: text(doc.className),
        joinAcademicYear: text(doc.joinAcademicYear),
        department: text(doc.department),
        unit: text(doc.unit),
    };
}

const strip = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

// Builds the plan from the two old collections. `resolvePersonId(email, personType)` answers the Central person id
// of an account that has none.
async function plan(db, { resolvePersonId } = {}) {
    const [employees, students, existing] = await Promise.all([
        db.collection('users').find({}).toArray(),
        db.collection('userstudents').find({}).toArray(),
        db.collection('people').find({}, { projection: { _id: 1, email: 1, centralPersonId: 1 } }).toArray(),
    ]);
    const already = new Set(existing.map((row) => String(row._id)));

    const result = { create: [], alreadyThere: 0, needsReview: [], duplicates: [] };
    // People already written count as taken, so a second run does not try to place the same email twice.
    const seenEmails = new Map(existing.map((row) => [row.email, String(row._id)]));
    const seenPersonIds = new Map(existing.map((row) => [row.centralPersonId, String(row._id)]));

    const rows = [
        ...employees.map((doc) => ({ doc, type: PERSON_TYPE.EMPLOYEE })),
        ...students.map((doc) => ({ doc, type: PERSON_TYPE.STUDENT })),
    ];

    for (const { doc, type } of rows) {
        if (already.has(String(doc._id))) {
            result.alreadyThere += 1;
            continue;
        }
        let personId = text(doc.centralPersonId);
        if (!personId && resolvePersonId) personId = await resolvePersonId(String(doc.email).trim().toLowerCase(), type);
        if (!personId) {
            result.needsReview.push({ id: String(doc._id), email: doc.email, type, reason: 'no Central person id' });
            continue;
        }
        const email = String(doc.email).trim().toLowerCase();
        const clash = seenEmails.get(email) || seenPersonIds.get(personId);
        if (clash) {
            result.duplicates.push({ id: String(doc._id), email, type, sameAs: clash });
            continue;
        }
        seenEmails.set(email, String(doc._id));
        seenPersonIds.set(personId, String(doc._id));
        result.create.push(strip(type === PERSON_TYPE.EMPLOYEE ? personFromEmployee(doc, personId) : personFromStudent(doc, personId)));
    }
    return result;
}

async function apply(db, create) {
    if (create.length === 0) return 0;
    const operations = create.map((person) => {
        const { _id, ...rest } = person;
        return { updateOne: { filter: { _id }, update: { $setOnInsert: rest }, upsert: true } };
    });
    const result = await db.collection('people').bulkWrite(operations, { ordered: false });
    return result.upsertedCount;
}

async function main() {
    const write = process.argv.includes('--apply');
    const resolve = !process.argv.includes('--no-resolve');
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    let resolvePersonId;
    if (resolve) {
        const { lookupEmployeeByEmail, lookupStudentByEmail } = require('../services/mwsDataCenterClient');
        resolvePersonId = async (email, type) => {
            try {
                const found = type === PERSON_TYPE.STUDENT ? await lookupStudentByEmail(email) : await lookupEmployeeByEmail(email);
                return found?.person_id;
            } catch (error) {
                console.warn(`  lookup failed for ${email}: ${error.message}`);
                return undefined;
            }
        };
    }

    const result = await plan(db, { resolvePersonId });
    console.log(`to create: ${result.create.length} (${result.create.filter((p) => p.personType === PERSON_TYPE.EMPLOYEE).length} employees, ${result.create.filter((p) => p.personType === PERSON_TYPE.STUDENT).length} students)`);
    console.log(`already in people: ${result.alreadyThere}`);
    console.log(`needs review (not migrated): ${result.needsReview.length}`);
    result.needsReview.slice(0, 50).forEach((row) => console.log(`  ${row.type} ${row.email} (${row.id}): ${row.reason}`));
    console.log(`duplicates (not migrated): ${result.duplicates.length}`);
    result.duplicates.slice(0, 50).forEach((row) => console.log(`  ${row.type} ${row.email} (${row.id}) same person or email as ${row.sameAs}`));
    if (result.duplicates.length) {
        console.log('A duplicate means the Central sync already made this person with a new id. Their old references need: npm run migrate:people:refs');
    }

    if (write) {
        const created = await apply(db, result.create);
        console.log(`written: ${created}`);
    } else {
        console.log('dry-run: nothing written. Run again with --apply to write.');
    }
    await mongoose.disconnect();
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = { plan, apply, personFromEmployee, personFromStudent };
