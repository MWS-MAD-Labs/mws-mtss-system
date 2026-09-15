// Read-only - prints the raw interventions array for students matching a
// name pattern, so we can see exactly why resetInterventionsToTier1.js's
// isDefaultEntry() check did or didn't pick up a given entry.
//
// Usage: node src/scripts/inspectStudentInterventions.js "<name substring>"
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');

async function run() {
    const namePattern = process.argv[2] || 'aisyah';
    console.log(`🔍 Looking up students matching "${namePattern}" (read-only, writes nothing)\n`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    const students = await MTSSStudent.find({ name: new RegExp(namePattern, 'i') })
        .select('name email currentGrade className interventions');

    console.log(`Found ${students.length} match(es)\n`);
    for (const student of students) {
        console.log(`=== ${student.name} (${student.email || 'no email'}) — ${student.currentGrade || '?'} / ${student.className || '?'} — _id: ${student._id} ===`);
        console.log(JSON.stringify(student.interventions, null, 2));
        console.log('');
    }

    await mongoose.connection.close();
}

run().catch((error) => {
    console.error('❌ Failed:', error);
    process.exitCode = 1;
});
