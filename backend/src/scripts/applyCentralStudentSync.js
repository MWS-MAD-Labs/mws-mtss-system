// Applies the sync dryRunCentralStudentSync.js only ever previewed:
// creates an MTSSStudent record for every Central-enrolled student that
// doesn't have one yet, and updates identity fields (name, grade, class)
// on records that already exist and have drifted from Central.
//
// Deliberately never touches:
//   - a record Central no longer shows as enrolled (likely has real
//     intervention history - that's studentDeactivationSync.js's job to
//     flip isActive on the login side, not this script's to alter here)
//   - a record with no Central match at all (manually added, or a data
//     mismatch - needs a human, not a script)
// Run the dry-run first if there's any doubt what this will do - same
// matching logic, this just writes instead of printing.
//
// Usage: node src/scripts/applyCentralStudentSync.js
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');

const ENROLLED_STATUSES = new Set(['REGISTERED', 'ACTIVE']);
const ALL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

async function fetchCentralStudentsByStatus() {
    const byStatus = {};
    for (const status of ALL_STATUSES) {
        try {
            byStatus[status] = await listStudentsByStatus(status);
        } catch (error) {
            console.error(`⚠️  Failed to fetch Central students with status=${status}:`, error.message);
            byStatus[status] = [];
        }
    }
    return byStatus;
}

async function run() {
    console.log('🔄 Applying Central student roster sync to MTSSStudent\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}`);
    console.log(`✓ Central API: ${process.env.MWS_DATA_CENTER_API_URL}\n`);

    const byStatus = await fetchCentralStudentsByStatus();
    const centralByEmail = new Map();
    for (const status of ALL_STATUSES) {
        for (const student of byStatus[status]) {
            const email = normalizeEmail(student.email);
            if (email) centralByEmail.set(email, { ...student, status });
        }
    }

    const mtssStudents = await MTSSStudent.find({}).select('name email currentGrade className status');
    const mtssByEmail = new Map();
    mtssStudents.forEach((doc) => {
        const email = normalizeEmail(doc.email);
        if (email) mtssByEmail.set(email, doc);
    });

    const createdIds = [];
    const updatedIds = [];
    const errors = [];

    for (const [email, central] of centralByEmail) {
        if (!ENROLLED_STATUSES.has(central.status)) continue; // out of scope - see header

        const existing = mtssByEmail.get(email);

        if (!existing) {
            try {
                const student = await MTSSStudent.create({
                    name: central.full_name,
                    email,
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

        if (Object.keys(update).length) {
            try {
                await MTSSStudent.findByIdAndUpdate(existing._id, update, { runValidators: true });
                updatedIds.push(existing._id);
                console.log(`  ~ updated ${email}: ${Object.keys(update).join(', ')}`);
            } catch (error) {
                errors.push({ email, action: 'update', error: error.message });
                console.error(`  ✗ failed to update ${email}: ${error.message}`);
            }
        }
    }

    console.log(`\n✅ Done. Created ${createdIds.length}, updated ${updatedIds.length}, ${errors.length} error(s).`);
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
