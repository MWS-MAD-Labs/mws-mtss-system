// Applies the sync dryRunCentralStudentSync.js only ever previewed:
// creates an MTSSStudent record for every Central-enrolled student that
// doesn't have one yet, and updates identity fields (name, grade, class)
// on records that already exist and have drifted from Central.
//
// Deliberately never touches identity fields (name/currentGrade/className)
// for a record Central no longer shows as enrolled - those stay frozen as
// the student's last real snapshot, since the record likely has real
// intervention history attached. status IS still kept in sync either way
// (MTSSStudent.status stores Central's StudentStatus value as-is), so a
// graduated/withdrawn student correctly drops out of "All Students" via the
// existing Status filter.
//
// Still never touches identity/status fields, and never deletes, a record
// with no Central match at all (manually added, or a data mismatch) - but
// it IS flagged via orphanedAt (models/MTSSStudent.js) so an admin can find
// and decide what to do with it.
// Run the dry-run first if there's any doubt what this will do - same
// matching logic, this just writes instead of printing.
//
// Usage: node src/scripts/applyCentralStudentSync.js
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');
const { normalizeGender } = require('../utils/studentUserHelpers');

const ENROLLED_STATUSES = new Set(['REGISTERED', 'ACTIVE']);
const ALL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

// Central is the source of truth - a genuinely empty response (every
// status fetch succeeds, none of them have anyone) is real data that must
// propagate here exactly like any other answer from Central would. A
// fetch that actually fails is a different thing entirely and must not be
// silently treated as "Central says nobody" - re-thrown as-is so run()
// aborts instead of diffing against a partial/unknown picture.
async function fetchCentralStudentsByStatus() {
    const byStatus = {};
    for (const status of ALL_STATUSES) {
        byStatus[status] = await listStudentsByStatus(status);
    }
    return byStatus;
}

async function run() {
    console.log('🔄 Applying Central student roster sync to MTSSStudent\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}`);
    console.log(`✓ Central API: ${process.env.MWS_DATA_CENTER_API_URL}\n`);

    const byStatus = await fetchCentralStudentsByStatus();
    // No try/catch here (unlike the scheduled job) - a failure should abort
    // this manual script loudly (non-zero exit, see the bottom of the
    // file) rather than silently no-op, since a human is watching it run.
    const centralByEmail = new Map();
    for (const status of ALL_STATUSES) {
        for (const student of byStatus[status]) {
            const email = normalizeEmail(student.email);
            if (email) centralByEmail.set(email, { ...student, status });
        }
    }

    const mtssStudents = await MTSSStudent.find({}).select('name email gender currentGrade className status orphanedAt');
    const mtssByEmail = new Map();
    mtssStudents.forEach((doc) => {
        const email = normalizeEmail(doc.email);
        if (email) mtssByEmail.set(email, doc);
    });

    const createdIds = [];
    const updatedIds = [];
    const orphanedIds = [];
    const unorphanedIds = [];
    const errors = [];

    for (const [email, central] of centralByEmail) {
        const isEnrolled = ENROLLED_STATUSES.has(central.status);
        // Direct pass-through - MTSSStudent.status stores Central's exact
        // StudentStatus value, no local narrowing table needed.
        const targetStatus = central.status;

        const existing = mtssByEmail.get(email);

        if (!existing) {
            if (!isEnrolled) continue; // no MTSS record and not currently enrolled - nothing to create
            try {
                const student = await MTSSStudent.create({
                    name: central.full_name,
                    email,
                    gender: normalizeGender(central.gender),
                    status: targetStatus,
                    currentGrade: central.current_grade || undefined,
                    className: central.current_class || undefined,
                });
                createdIds.push(student._id);
                console.log(`  + created ${email} — ${central.full_name}`);
            } catch (error) {
                errors.push({ email, action: 'create', error: error.message });
                console.error(`  ✗ failed to create ${email}: ${error.message}`);
            }
            continue;
        }

        const update = {};
        if (existing.status !== targetStatus) {
            update.status = targetStatus;
        }
        const normalizedGender = normalizeGender(central.gender);
        if (normalizedGender && existing.gender !== normalizedGender) {
            update.gender = normalizedGender;
        }
        if (existing.orphanedAt) {
            update.orphanedAt = null;
        }

        if (isEnrolled) {
            if (existing.currentGrade !== central.current_grade) {
                update.currentGrade = central.current_grade;
            }
            // Same rule the dry-run used: only apply a class when Central
            // actually has one - most students aren't enrolled into a class
            // there yet, and MTSS's own className stays authoritative until it
            // does.
            if (central.current_class && existing.className !== central.current_class) {
                update.className = central.current_class;
            }
            if (existing.name !== central.full_name) {
                update.name = central.full_name;
            }
        }

        if (Object.keys(update).length) {
            try {
                await MTSSStudent.findByIdAndUpdate(existing._id, update, { runValidators: true });
                updatedIds.push(existing._id);
                if (update.orphanedAt === null) unorphanedIds.push(existing._id);
                console.log(`  ~ updated ${email}: ${Object.keys(update).join(', ')}`);
            } catch (error) {
                errors.push({ email, action: 'update', error: error.message });
                console.error(`  ✗ failed to update ${email}: ${error.message}`);
            }
        }
    }

    // Anything never visited above has no Central match at all under any
    // status - flag it (if not already flagged) rather than touching its data.
    for (const [email, doc] of mtssByEmail) {
        if (centralByEmail.has(email)) continue;
        if (doc.orphanedAt) continue;
        try {
            await MTSSStudent.findByIdAndUpdate(doc._id, { orphanedAt: new Date() });
            orphanedIds.push(doc._id);
            console.log(`  ! flagged ${email} as orphaned (no Central match)`);
        } catch (error) {
            errors.push({ email, action: 'flag-orphan', error: error.message });
            console.error(`  ✗ failed to flag ${email} as orphaned: ${error.message}`);
        }
    }

    console.log(`\n✅ Done. Created ${createdIds.length}, updated ${updatedIds.length}, ${orphanedIds.length} newly orphaned, ${unorphanedIds.length} un-orphaned, ${errors.length} error(s).`);
    if (errors.length) {
        console.log('\nErrors:');
        errors.forEach((e) => console.log(`  ${e.action} ${e.email}: ${e.error}`));
    }

    // No socket broadcast here - this runs as a standalone script (no live
    // server/socket instance), unlike the deactivation jobs which run
    // inside the running app.js process. Anyone with a dashboard open at
    // sync time just sees the new roster on their next natural refresh.
    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Sync failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
