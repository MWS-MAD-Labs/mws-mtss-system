// One-time migration: remaps status/gender (MTSSStudent, UserStudent) and
// gender/employmentStatus (User) from the old local vocabulary to Central's
// exact enum casing (see models/MTSSStudent.js, models/UserStudent.js,
// models/User.js, and jobs/mtssStudentRosterSync.js / utils/
// employeeCentralSync.js / utils/studentUserHelpers.js for the schema/sync
// side of this change). department/unit/jobLevel need no data migration -
// they already stored Central's raw strings, only the schema's enum
// constraint was wrong (now removed).
//
// A value with no Central equivalent (gender: 'other'/'nonbinary'/
// 'prefer_not_to_say') is cleared rather than guessed - Central doesn't
// know it either, so neither should the local copy.
//
// Dry-run by default (prints what would change, writes nothing). Pass
// --apply to actually write. Mirrors the dry-run/apply convention already
// used by dryRunCentralStudentSync.js/applyCentralStudentSync.js.
//
// Usage:
//   node src/scripts/migrateEnumCasingToCentral.js            (dry-run)
//   node src/scripts/migrateEnumCasingToCentral.js --apply    (writes)
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const UserStudent = require('../models/UserStudent');
const User = require('../models/User');

const STATUS_MAP = {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    graduated: 'GRADUATED',
    transferred: 'TRANSFERRED',
    // MTSSStudent's old vocabulary had 'pending' (Central hasn't enrolled
    // them into a class yet) with no Daily-Checkin-side equivalent -
    // REGISTERED is the matching Central status.
    pending: 'REGISTERED',
};

const GENDER_MAP = {
    male: 'MALE',
    female: 'FEMALE',
    // 'other'/'nonbinary'/'prefer_not_to_say' have no Central equivalent -
    // cleared, not mapped.
};

const EMPLOYMENT_STATUS_MAP = {
    Permanent: 'PERMANENT',
    Contract: 'CONTRACT',
    Probation: 'PROBATION',
    Freelance: 'FREELANCE',
    'Part Time': 'PART_TIME',
    WFH: 'WFH',
};

const APPLY = process.argv.includes('--apply');

async function migrateStatusGenderModel(Model, label, { includeStatus }) {
    const selectFields = includeStatus ? 'email status gender' : 'email gender';
    const docs = await Model.find({}).select(selectFields);
    let statusChanged = 0;
    let genderChanged = 0;
    let genderCleared = 0;

    for (const doc of docs) {
        const update = {};
        const unset = {};

        if (includeStatus && doc.status && STATUS_MAP[doc.status]) {
            update.status = STATUS_MAP[doc.status];
            statusChanged += 1;
        }

        if (doc.gender) {
            if (GENDER_MAP[doc.gender]) {
                update.gender = GENDER_MAP[doc.gender];
                genderChanged += 1;
            } else {
                unset.gender = '';
                genderCleared += 1;
            }
        }

        if (!Object.keys(update).length && !Object.keys(unset).length) continue;

        console.log(`  ${label} ${doc.email}: ${JSON.stringify(update)}${Object.keys(unset).length ? ` (clearing ${Object.keys(unset).join(', ')})` : ''}`);
        if (APPLY) {
            const ops = {};
            if (Object.keys(update).length) ops.$set = update;
            if (Object.keys(unset).length) ops.$unset = unset;
            await Model.updateOne({ _id: doc._id }, ops, { runValidators: true });
        }
    }

    console.log(`${label}: ${docs.length} checked, ${statusChanged} status remapped, ${genderChanged} gender remapped, ${genderCleared} gender cleared (no Central equivalent)`);
}

async function migrateEmployeeUsers() {
    const docs = await User.find({}).select('email gender employmentStatus');
    let genderChanged = 0;
    let genderCleared = 0;
    let employmentStatusChanged = 0;

    for (const doc of docs) {
        const update = {};
        const unset = {};

        if (doc.gender) {
            if (GENDER_MAP[doc.gender]) {
                update.gender = GENDER_MAP[doc.gender];
                genderChanged += 1;
            } else {
                unset.gender = '';
                genderCleared += 1;
            }
        }

        if (doc.employmentStatus && EMPLOYMENT_STATUS_MAP[doc.employmentStatus]) {
            update.employmentStatus = EMPLOYMENT_STATUS_MAP[doc.employmentStatus];
            employmentStatusChanged += 1;
        }

        if (!Object.keys(update).length && !Object.keys(unset).length) continue;

        console.log(`  User ${doc.email}: ${JSON.stringify(update)}${Object.keys(unset).length ? ` (clearing gender)` : ''}`);
        if (APPLY) {
            const ops = {};
            if (Object.keys(update).length) ops.$set = update;
            if (Object.keys(unset).length) ops.$unset = unset;
            await User.updateOne({ _id: doc._id }, ops, { runValidators: true });
        }
    }

    console.log(`User (employee): ${docs.length} checked, ${genderChanged} gender remapped, ${genderCleared} gender cleared, ${employmentStatusChanged} employmentStatus remapped`);
}

async function run() {
    console.log(`${APPLY ? '✍️  Applying' : '👀 Dry-run of'} enum-casing migration to Central's casing\n`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    await migrateStatusGenderModel(MTSSStudent, 'MTSSStudent', { includeStatus: true });
    await migrateStatusGenderModel(UserStudent, 'UserStudent', { includeStatus: true });
    await migrateEmployeeUsers();

    if (!APPLY) {
        console.log('\nDry-run only - nothing was written. Re-run with --apply to write these changes.');
    }

    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
