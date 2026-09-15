// Finds and (only with --confirm) removes MTSSStudent records that came
// from seedMtssStudents.js's hardcoded dummy roster instead of a real
// Central enrollment - that seed script (and its siblings seedMtssData.js,
// seedMtssGrade7HelixComplete.js, seedMtssPilotUnitClasses.js) have no
// env guard, so any of them could have been run against production by
// mistake instead of dev.
//
// Identification requires BOTH signals to agree, same as
// dryRunCentralStudentSync.js's noMatchInCentral computation plus a
// cross-check against seedMtssStudents.js's own email list:
//   - no matching email in Central at all (live check, not the cached
//     orphanedAt field - see MTSSStudent.js's orphanedAt comment)
//   - AND the email appears in seedMtssStudents.js's RAW_DATA
// Anything that only matches one signal is reported but never touched.
//
// No cascade-delete exists anywhere in this codebase (confirmed by
// inspection), so every collection referencing MTSSStudent is cleaned up
// here by hand: MentorAssignment.studentIds, MTSSTierReviewRequest.studentIds,
// TeacherAlert.mtssStudentId (NOT studentId - that field refs the
// unrelated User login collection), AIConversation.studentId.
// UserStudent (portal login accounts) link to MTSSStudent only by email
// match, not ObjectId, so it's flagged but never deleted here - a
// separate, human decision.
//
// interventions/kindergartenMoodCheckIns/kindergartenHomeObservations are
// embedded subdocuments on MTSSStudent itself, not separate collections -
// deleting the MTSSStudent doc removes them automatically.
//
// MTSSStudent has no soft-delete field, so this is a hard, permanent
// delete - --confirm mode always writes a full JSON backup of everything
// it's about to touch before deleting anything.
//
// Usage:
//   node src/scripts/purgeDummyStudents.js              # dry-run, writes nothing
//   node src/scripts/purgeDummyStudents.js --confirm     # backs up, then deletes
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const MentorAssignment = require('../models/MentorAssignment');
const TeacherAlert = require('../models/TeacherAlert');
const AIConversation = require('../models/AIConversation');
const MTSSTierReviewRequest = require('../models/MTSSTierReviewRequest');
const UserStudent = require('../models/UserStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');

const ENROLLED_STATUSES = ['REGISTERED', 'ACTIVE'];
const ALL_CENTRAL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

// Reads seedMtssStudents.js as plain text and regex-extracts its RAW_DATA
// email column - deliberately NOT require()'d, since that file runs a
// live seed() call on require with no module.exports guard.
function extractSeedEmails() {
    const seedFilePath = path.join(__dirname, 'seedMtssStudents.js');
    const source = fs.readFileSync(seedFilePath, 'utf8');
    const emailPattern = /[a-z0-9._%+-]+(?:​)?[a-z0-9._%+-]*@millennia21?\.id/gi;
    const matches = source.match(emailPattern) || [];
    return new Set(matches.map((email) => normalizeEmail(email.replace(/​/g, ''))));
}

async function fetchCentralEnrolledEmails() {
    const emails = new Set();
    for (const status of ALL_CENTRAL_STATUSES) {
        const students = await listStudentsByStatus(status);
        if (!ENROLLED_STATUSES.includes(status)) continue;
        for (const student of students) {
            const email = normalizeEmail(student.email);
            if (email) emails.add(email);
        }
    }
    return emails;
}

async function countReferences(studentId) {
    const [mentorAssignments, tierReviewRequests, teacherAlerts, aiConversations] = await Promise.all([
        MentorAssignment.countDocuments({ studentIds: studentId }),
        MTSSTierReviewRequest.countDocuments({ studentIds: studentId }),
        TeacherAlert.countDocuments({ mtssStudentId: studentId }),
        AIConversation.countDocuments({ studentId }),
    ]);
    // userStudent is filled in by the caller (buildBlastRadius), which
    // resolves it separately via an email lookup, not an ObjectId ref.
    return { mentorAssignments, tierReviewRequests, teacherAlerts, aiConversations, userStudent: 0 };
}

async function classifyCandidates() {
    const [centralEmails, seedEmails] = await Promise.all([
        fetchCentralEnrolledEmails(),
        Promise.resolve(extractSeedEmails()),
    ]);
    console.log(`✓ Central enrolled emails: ${centralEmails.size}`);
    console.log(`✓ seedMtssStudents.js emails: ${seedEmails.size}\n`);

    const allStudents = await MTSSStudent.find({}).select('name email currentGrade className orphanedAt');

    const highConfidence = [];
    const reviewOnly = [];
    const skippedNowInCentral = [];

    for (const student of allStudents) {
        const email = normalizeEmail(student.email);
        const inCentral = email && centralEmails.has(email);
        const inSeedList = email && seedEmails.has(email);

        if (inCentral) {
            if (inSeedList) skippedNowInCentral.push(student);
            continue;
        }
        if (inSeedList) {
            highConfidence.push(student);
        } else {
            reviewOnly.push(student);
        }
    }

    return { highConfidence, reviewOnly, skippedNowInCentral };
}

async function buildBlastRadius(students) {
    const rows = [];
    for (const student of students) {
        const refs = await countReferences(student._id);
        const email = normalizeEmail(student.email);
        const portalAccount = email ? await UserStudent.findOne({ email }).select('_id email') : null;
        refs.userStudent = portalAccount ? 1 : 0;
        rows.push({ student, refs, portalAccount });
    }
    return rows;
}

function printBlastRadius(rows) {
    rows.forEach(({ student, refs, portalAccount }) => {
        console.log(`  - ${student.email || '(no email)'} — ${student.name} — ${student.currentGrade || '?'} / ${student.className || '?'} — orphanedAt: ${student.orphanedAt ? student.orphanedAt.toISOString() : 'not set'}`);
        console.log(`      MentorAssignment: ${refs.mentorAssignments}, MTSSTierReviewRequest: ${refs.tierReviewRequests}, TeacherAlert: ${refs.teacherAlerts}, AIConversation: ${refs.aiConversations}`);
        if (portalAccount) {
            console.log(`      ⚠ has a UserStudent portal login account (${portalAccount._id}) - NOT deleted by this script, review separately`);
        }
    });
}

async function dryRun() {
    console.log('🔍 Dry-run: finding dummy MTSS students (read-only, writes nothing)\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    const { highConfidence, reviewOnly, skippedNowInCentral } = await classifyCandidates();

    console.log(`=== HIGH-CONFIDENCE dummy candidates (no Central match + in seed list): ${highConfidence.length} ===`);
    const highConfidenceRows = await buildBlastRadius(highConfidence);
    printBlastRadius(highConfidenceRows);

    console.log(`\n=== REVIEW ONLY - no Central match but NOT in seed list (not touched): ${reviewOnly.length} ===`);
    reviewOnly.forEach((s) => console.log(`  ? ${s.email || '(no email)'} — ${s.name}`));

    console.log(`\n=== SKIPPED - in seed list but Central has a match now (never delete): ${skippedNowInCentral.length} ===`);
    skippedNowInCentral.forEach((s) => console.log(`  ✓ ${s.email} — ${s.name} (real, keep)`));

    console.log('\n✅ Dry-run complete. No data was written.');
    if (highConfidence.length > 0) {
        console.log(`\nTo delete the ${highConfidence.length} high-confidence record(s) above, re-run with --confirm.`);
    }

    await mongoose.connection.close();
}

async function deleteWithConfirm() {
    console.log('🔧 Purging dummy MTSS students (--confirm mode)\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    const { highConfidence } = await classifyCandidates();
    if (highConfidence.length === 0) {
        console.log('No high-confidence dummy students found. Nothing to do.');
        await mongoose.connection.close();
        return;
    }

    console.log(`Found ${highConfidence.length} high-confidence dummy student(s):`);
    const rows = await buildBlastRadius(highConfidence);
    printBlastRadius(rows);

    // Back up every matching student plus every doc that references them,
    // before touching anything - no soft-delete exists, this is the only
    // undo path.
    const backup = { generatedAt: new Date().toISOString(), students: [] };
    for (const { student } of rows) {
        const [mentorAssignments, tierReviewRequests, teacherAlerts, aiConversations] = await Promise.all([
            MentorAssignment.find({ studentIds: student._id }).lean(),
            MTSSTierReviewRequest.find({ studentIds: student._id }).lean(),
            TeacherAlert.find({ mtssStudentId: student._id }).lean(),
            AIConversation.find({ studentId: student._id }).lean(),
        ]);
        backup.students.push({
            student: student.toObject(),
            mentorAssignments,
            tierReviewRequests,
            teacherAlerts,
            aiConversations,
        });
    }

    const outputDir = path.join(__dirname, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    const backupPath = path.join(outputDir, `dummy-students-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`\n✓ Backup written: ${backupPath}\n`);

    let deletedStudents = 0;
    let cleanedAssignments = 0;
    let cleanedTierRequests = 0;
    let deletedAlerts = 0;
    let deletedConversations = 0;

    for (const { student } of rows) {
        const studentId = student._id;

        const assignments = await MentorAssignment.find({ studentIds: studentId });
        for (const assignment of assignments) {
            assignment.studentIds = assignment.studentIds.filter((id) => id.toString() !== studentId.toString());
            if (assignment.studentIds.length === 0) {
                await MentorAssignment.deleteOne({ _id: assignment._id });
                console.log(`  ✓ deleted now-empty MentorAssignment ${assignment._id}`);
            } else {
                await assignment.save();
                console.log(`  ✓ removed ${studentId} from MentorAssignment ${assignment._id}`);
            }
            cleanedAssignments += 1;
        }

        const tierRequests = await MTSSTierReviewRequest.find({ studentIds: studentId });
        for (const request of tierRequests) {
            request.studentIds = request.studentIds.filter((id) => id.toString() !== studentId.toString());
            if (request.studentIds.length === 0) {
                await MTSSTierReviewRequest.deleteOne({ _id: request._id });
                console.log(`  ✓ deleted now-empty MTSSTierReviewRequest ${request._id}`);
            } else {
                await request.save();
                console.log(`  ✓ removed ${studentId} from MTSSTierReviewRequest ${request._id}`);
            }
            cleanedTierRequests += 1;
        }

        const alertResult = await TeacherAlert.deleteMany({ mtssStudentId: studentId });
        deletedAlerts += alertResult.deletedCount;
        if (alertResult.deletedCount) {
            console.log(`  ✓ deleted ${alertResult.deletedCount} TeacherAlert(s) for ${studentId}`);
        }

        const conversationResult = await AIConversation.deleteMany({ studentId });
        deletedConversations += conversationResult.deletedCount;
        if (conversationResult.deletedCount) {
            console.log(`  ✓ deleted ${conversationResult.deletedCount} AIConversation(s) for ${studentId}`);
        }

        await MTSSStudent.deleteOne({ _id: studentId });
        console.log(`  ✓ deleted MTSSStudent ${student.email} (${student.name}, ${studentId})`);
        deletedStudents += 1;
    }

    console.log(`\n✅ Done. Deleted ${deletedStudents} student(s). Cleaned ${cleanedAssignments} MentorAssignment ref(s), ${cleanedTierRequests} MTSSTierReviewRequest ref(s), ${deletedAlerts} TeacherAlert(s), ${deletedConversations} AIConversation(s).`);
    console.log(`Backup: ${backupPath}`);

    await mongoose.connection.close();
}

async function run() {
    const confirm = process.argv.includes('--confirm');
    if (confirm) {
        await deleteWithConfirm();
    } else {
        await dryRun();
    }
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
