// Read-only comparison between Central's student roster and MTSS's own
// MTSSStudent collection. Writes nothing - it only prints a diff report so a
// human can review it before any real sync job is built or run.
//
// Central has no concept of interventions/checkIns/notes/tags - those stay
// MTSS-only, always. This script never even reads those fields; it exists
// to answer one question: "if we synced identity fields (name, grade, class,
// status) from Central, what would actually change?"
//
// Usage: node src/scripts/dryRunCentralStudentSync.js
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');

// Central has no single "currently enrolled" status - REGISTERED and ACTIVE
// both plausibly mean that depending on the school's own data entry habits
// (this local dev dataset only ever used REGISTERED). Everything else
// (GRADUATED, TRANSFERRED, WITHDRAWN, ARCHIVED, INACTIVE) is reported
// separately rather than silently ignored, since an MTSS record in one of
// those states almost certainly still has real intervention history.
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
    console.log('🔍 Dry-run: Central student roster vs MTSSStudent (read-only, writes nothing)\n');

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

    console.log('Central student counts by status:');
    ALL_STATUSES.forEach((status) => console.log(`  ${status}: ${byStatus[status].length}`));
    console.log(`  Total distinct emails: ${centralByEmail.size}\n`);

    const mtssStudents = await MTSSStudent.find({}).select('name email currentGrade className status');
    console.log(`MTSSStudent records: ${mtssStudents.length}\n`);

    const mtssByEmail = new Map();
    mtssStudents.forEach((doc) => {
        const email = normalizeEmail(doc.email);
        if (email) mtssByEmail.set(email, doc);
    });

    const wouldCreate = [];
    const wouldUpdate = [];
    const noLongerEnrolled = [];
    const noMatchInCentral = [];

    centralByEmail.forEach((central, email) => {
        if (!ENROLLED_STATUSES.has(central.status)) return; // report separately below, not as a create candidate
        const existing = mtssByEmail.get(email);
        if (!existing) {
            wouldCreate.push({ email, name: central.full_name, grade: central.current_grade, className: central.current_class });
            return;
        }
        const changes = [];
        if (existing.currentGrade !== central.current_grade) {
            changes.push(`grade: "${existing.currentGrade}" -> "${central.current_grade}"`);
        }
        // Central's current_class only has a value once a student is
        // actually enrolled into a class there (StudentClassEnrollment) -
        // most students aren't yet, so current_class is null for them. Only
        // compare (and only ever apply, later) when Central actually has an
        // answer - MTSS's own className stays the authority for anyone
        // Central hasn't enrolled, instead of every one of them showing up
        // here as "should become null".
        if (central.current_class && existing.className !== central.current_class) {
            changes.push(`class: "${existing.className}" -> "${central.current_class}"`);
        }
        if (existing.name !== central.full_name) {
            changes.push(`name: "${existing.name}" -> "${central.full_name}"`);
        }
        if (changes.length) {
            wouldUpdate.push({ email, changes });
        }
    });

    mtssByEmail.forEach((doc, email) => {
        const central = centralByEmail.get(email);
        if (!central) {
            noMatchInCentral.push({ email, name: doc.name });
            return;
        }
        if (!ENROLLED_STATUSES.has(central.status)) {
            noLongerEnrolled.push({ email, name: doc.name, centralStatus: central.status });
        }
    });

    console.log(`\n=== Would CREATE (in Central as enrolled, no MTSSStudent record yet): ${wouldCreate.length} ===`);
    wouldCreate.slice(0, 20).forEach((s) => console.log(`  + ${s.email} — ${s.name} — ${s.grade} / ${s.className}`));
    if (wouldCreate.length > 20) console.log(`  ...and ${wouldCreate.length - 20} more`);

    console.log(`\n=== Would UPDATE identity fields (record exists, something differs): ${wouldUpdate.length} ===`);
    wouldUpdate.slice(0, 20).forEach((s) => {
        console.log(`  ~ ${s.email}`);
        s.changes.forEach((c) => console.log(`      ${c}`));
    });
    if (wouldUpdate.length > 20) console.log(`  ...and ${wouldUpdate.length - 20} more`);

    console.log(`\n=== In MTSS but Central no longer shows them as enrolled (REVIEW BEFORE TOUCHING - likely has real intervention history): ${noLongerEnrolled.length} ===`);
    noLongerEnrolled.forEach((s) => console.log(`  ! ${s.email} — ${s.name} — Central status: ${s.centralStatus}`));

    console.log(`\n=== In MTSS with no matching Central record at all (REVIEW - may be manually added, or a data mismatch): ${noMatchInCentral.length} ===`);
    noMatchInCentral.forEach((s) => console.log(`  ? ${s.email} — ${s.name}`));

    console.log('\n✅ Dry-run complete. No data was written.');

    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Dry-run failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
