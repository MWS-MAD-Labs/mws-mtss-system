// Read-only investigation - finds MTSSStudent records that don't match
// any known seed script (purgeDummyStudents.js's high-confidence check
// found 60 dummy students, but none of them were "Aoraki"), to figure
// out where that class name actually comes from before deciding whether
// to remove those records too.
//
// Searches name/email/currentGrade/className for "aoraki" case-
// insensitively (not just className, in case it's stored somewhere
// unexpected), and reports each match's live Central status plus its
// full blast radius (MentorAssignment/TeacherAlert/AIConversation/
// MTSSTierReviewRequest/UserStudent), same shape as purgeDummyStudents.js
// so the two reports are directly comparable.
//
// Writes nothing, deletes nothing.
//
// Usage: node src/scripts/findAorakiStudents.js
require('dotenv').config();
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

async function run() {
    console.log('🔍 Searching for "aoraki" across MTSSStudent (read-only, writes nothing)\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    const centralEmails = await fetchCentralEnrolledEmails();
    console.log(`✓ Central enrolled emails: ${centralEmails.size}\n`);

    const pattern = /aoraki/i;
    const matches = await MTSSStudent.find({
        $or: [
            { name: pattern },
            { email: pattern },
            { currentGrade: pattern },
            { className: pattern },
        ],
    }).select('name email currentGrade className orphanedAt status createdAt updatedAt');

    console.log(`=== Found ${matches.length} record(s) matching "aoraki" ===\n`);

    for (const student of matches) {
        const email = normalizeEmail(student.email);
        const inCentral = email && centralEmails.has(email);

        const [mentorAssignments, tierReviewRequests, teacherAlerts, aiConversations, portalAccount] = await Promise.all([
            MentorAssignment.countDocuments({ studentIds: student._id }),
            MTSSTierReviewRequest.countDocuments({ studentIds: student._id }),
            TeacherAlert.countDocuments({ mtssStudentId: student._id }),
            AIConversation.countDocuments({ studentId: student._id }),
            email ? UserStudent.findOne({ email }).select('_id') : null,
        ]);

        console.log(`  - ${student.email || '(no email)'} — ${student.name} — ${student.currentGrade || '?'} / ${student.className || '?'} — status: ${student.status || '?'}`);
        console.log(`      _id: ${student._id}`);
        console.log(`      createdAt: ${student.createdAt ? student.createdAt.toISOString() : '?'}, updatedAt: ${student.updatedAt ? student.updatedAt.toISOString() : '?'}`);
        console.log(`      orphanedAt: ${student.orphanedAt ? student.orphanedAt.toISOString() : 'not set'}, in Central right now: ${inCentral ? 'YES' : 'no'}`);
        console.log(`      MentorAssignment: ${mentorAssignments}, MTSSTierReviewRequest: ${tierReviewRequests}, TeacherAlert: ${teacherAlerts}, AIConversation: ${aiConversations}, UserStudent portal login: ${portalAccount ? 1 : 0}`);
        console.log('');
    }

    if (matches.length === 0) {
        console.log('No "aoraki" matches found in MTSSStudent at all - the dashboard roster showing it may be reading from a different source (cache, or a different collection/field) - report this back for further investigation.');
    }

    console.log('✅ Search complete. No data was written.');
    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
