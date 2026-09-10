// Read-only inspection of the 5 typo-email MTSSStudent records that turned
// out to collide with an already-correct record on update (see
// fixMismatchedStudentEmails.js's E11000 duplicate key errors). Prints both
// records side by side, plus whether either has real MentorAssignment data
// attached, so a human can decide whether to merge, delete the typo copy
// outright, or handle one individually - never done automatically here.
//
// Usage: node src/scripts/inspectDuplicateStudentEmails.js
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const MentorAssignment = require('../models/MentorAssignment');

const PAIRS = [
    { typo: 'alya.humaira@millennia.id', correct: 'alya.humaira@millennia21.id' },
    { typo: 'aqeela.rumaisha@millennia.id', correct: 'aqeela.rumaisha@millennia21.id' },
    { typo: 'sakha.askar​amurti@millennia21.id', correct: 'sakha.askaramurti@millennia21.id' },
    { typo: 'elliana.sitorus@millennia.21.id', correct: 'elliana.sitorus@millennia21.id' },
    { typo: 'kareem.mohammad@millennia21.id', correct: 'kareem.muhammad@millennia21.id' },
];

const normalizeForLookup = (value = '') => String(value || '').trim().toLowerCase();

async function describe(email) {
    const doc = await MTSSStudent.findOne({ email: normalizeForLookup(email) }).lean();
    if (!doc) return { email, found: false };

    const assignments = await MentorAssignment.find({ studentIds: doc._id })
        .select('tier status focusAreas mentorId startDate endDate checkIns notes')
        .lean();

    return {
        email,
        found: true,
        id: doc._id,
        status: doc.status,
        className: doc.className,
        currentGrade: doc.currentGrade,
        createdAt: doc.createdAt,
        interventionsCount: Array.isArray(doc.interventions) ? doc.interventions.length : 0,
        mentorAssignmentCount: assignments.length,
        mentorAssignments: assignments.map((a) => ({
            id: a._id,
            tier: a.tier,
            status: a.status,
            focusAreas: a.focusAreas,
            checkInCount: Array.isArray(a.checkIns) ? a.checkIns.length : 0,
            noteCount: Array.isArray(a.notes) ? a.notes.length : 0,
        })),
    };
}

async function run() {
    console.log('🔍 Inspecting duplicate MTSSStudent records (read-only)\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    for (const { typo, correct } of PAIRS) {
        console.log(`=== ${typo}  <->  ${correct} ===`);
        const [typoDoc, correctDoc] = await Promise.all([describe(typo), describe(correct)]);
        console.log('  typo record:   ', JSON.stringify(typoDoc, null, 2).replace(/\n/g, '\n  '));
        console.log('  correct record:', JSON.stringify(correctDoc, null, 2).replace(/\n/g, '\n  '));
        console.log('');
    }

    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
