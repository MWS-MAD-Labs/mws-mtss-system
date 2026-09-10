// Cleans up the 5 typo-email MTSSStudent records confirmed duplicate by
// inspectDuplicateStudentEmails.js - each collided with an already-correct
// record created by the 2026-09-03 roster refresh. Only aqeela.rumaisha's
// typo record has real data (a MentorAssignment with actual check-ins);
// everything else is a template-default interventions array with no
// MentorAssignment attached, confirmed safe to drop outright.
//
// Steps, in order:
//   1. Re-point aqeela's MentorAssignment (69e592f0cb78cd2abc395ee2) from
//      her old/typo student _id to her correct student _id.
//   2. Delete all 5 typo MTSSStudent records (aqeela's only after step 1
//      confirms the re-point succeeded).
//
// Usage: node src/scripts/mergeDuplicateStudentEmails.js
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const MentorAssignment = require('../models/MentorAssignment');

const AQEELA_OLD_ID = '6927c66799c753a07c5254b0';
const AQEELA_NEW_ID = '6a99310ba8728a08dbdc8aec';
const AQEELA_ASSIGNMENT_ID = '69e592f0cb78cd2abc395ee2';

const TYPO_IDS_TO_DELETE = [
    '6927c66599c753a07c525453', // alya.humaira@millennia.id
    AQEELA_OLD_ID,               // aqeela.rumaisha@millennia.id
    '6927f41e33e80b1d0242b913', // sakha.askar<ZWSP>amurti@millennia21.id
    '6927f43033e80b1d0242bc46', // elliana.sitorus@millennia.21.id
    '6965a5ae3890bf40adc30108', // kareem.mohammad@millennia21.id
];

async function run() {
    console.log('🔧 Merging/cleaning duplicate MTSSStudent records\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    // Step 1 - re-point aqeela's real MentorAssignment before anything is deleted.
    const assignment = await MentorAssignment.findById(AQEELA_ASSIGNMENT_ID);
    if (!assignment) {
        throw new Error(`MentorAssignment ${AQEELA_ASSIGNMENT_ID} not found - aborting before any deletes`);
    }
    const oldIdStr = AQEELA_OLD_ID;
    const hasOld = assignment.studentIds.some((id) => id.toString() === oldIdStr);
    if (!hasOld) {
        throw new Error(`MentorAssignment ${AQEELA_ASSIGNMENT_ID} no longer references ${oldIdStr} - aborting, re-check state before deleting anything`);
    }
    assignment.studentIds = assignment.studentIds.map((id) =>
        id.toString() === oldIdStr ? new mongoose.Types.ObjectId(AQEELA_NEW_ID) : id
    );
    await assignment.save();
    console.log(`✓ Re-pointed MentorAssignment ${AQEELA_ASSIGNMENT_ID}: ${AQEELA_OLD_ID} -> ${AQEELA_NEW_ID}`);

    // Verify the re-point actually landed before touching any MTSSStudent docs.
    const verify = await MentorAssignment.findById(AQEELA_ASSIGNMENT_ID);
    const nowHasNew = verify.studentIds.some((id) => id.toString() === AQEELA_NEW_ID);
    if (!nowHasNew) {
        throw new Error('Re-point verification failed - aborting before any deletes');
    }
    console.log('✓ Re-point verified\n');

    // Step 2 - delete the 5 typo records, now safe.
    for (const id of TYPO_IDS_TO_DELETE) {
        const doc = await MTSSStudent.findById(id);
        if (!doc) {
            console.log(`  ? ${id} - already gone, skipping`);
            continue;
        }
        await MTSSStudent.deleteOne({ _id: id });
        console.log(`  ✓ deleted ${doc.email} (${doc.name}, ${id})`);
    }

    console.log('\n✅ Done. Run src/scripts/dryRunCentralStudentSync.js to confirm no more unmatched records.');
    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
