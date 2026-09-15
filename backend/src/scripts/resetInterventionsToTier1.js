const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
require('dotenv').config();

const isDefaultEntry = (entry = {}) =>
    (entry.tier || 'tier1') === 'tier1' &&
    (entry.status || 'monitoring') === 'monitoring' &&
    !entry.assignedMentor &&
    !(entry.strategies && entry.strategies.length) &&
    !(entry.notes && entry.notes.trim());

const buildAuditRows = async () => {
    const students = await MTSSStudent.find({}, { name: 1, slug: 1, interventions: 1 }).lean();

    return students.flatMap((student) =>
        (student.interventions || [])
            .filter((entry) => !isDefaultEntry(entry))
            .map((entry) => ({
                studentId: String(student._id),
                studentName: student.name,
                studentSlug: student.slug || null,
                type: entry.type,
                tier: entry.tier,
                status: entry.status,
                assignedMentor: entry.assignedMentor ? String(entry.assignedMentor) : null,
                notes: entry.notes || '',
                strategies: entry.strategies || []
            }))
    );
};

const run = async ({ apply = false } = {}) => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    try {
        const rows = await buildAuditRows();
        const affectedStudentIds = [...new Set(rows.map((row) => row.studentId))];

        console.log(JSON.stringify({
            nonDefaultEntryCount: rows.length,
            affectedStudentCount: affectedStudentIds.length,
            rows
        }, null, 2));

        if (!apply) {
            console.log('Dry run only. No database changes were written.');
            return;
        }

        let resetEntryCount = 0;

        for (const studentId of affectedStudentIds) {
            const student = await MTSSStudent.findById(studentId);
            if (!student) continue;

            let changed = false;
            student.interventions = (student.interventions || []).map((entry) => {
                if (isDefaultEntry(entry)) return entry;

                changed = true;
                resetEntryCount += 1;

                const serialized = typeof entry.toObject === 'function' ? entry.toObject() : { ...entry };
                // snapshot the pre-reset state (tier/status/mentor/strategies/notes) into history
                // before wiping the live fields, so the new-period baseline doesn't lose the old record
                const snapshot = {
                    tier: serialized.tier,
                    status: serialized.status,
                    notes: serialized.notes || '',
                    assignedMentor: serialized.assignedMentor || null,
                    strategies: serialized.strategies || [],
                    updatedAt: serialized.updatedAt || new Date(),
                    updatedBy: serialized.updatedBy || null
                };

                return {
                    ...serialized,
                    tier: 'tier1',
                    status: 'monitoring',
                    strategies: [],
                    notes: '',
                    assignedMentor: null,
                    updatedAt: new Date(),
                    updatedBy: null,
                    history: [...(serialized.history || []), snapshot]
                };
            });

            if (changed) {
                student.markModified('interventions');
                await student.save();
            }
        }

        console.log(`Reset ${resetEntryCount} intervention entries across ${affectedStudentIds.length} students to Tier 1 baseline (prior state archived to history).`);
    } finally {
        await mongoose.connection.close();
    }
};

if (require.main === module) {
    const args = new Set(process.argv.slice(2));
    run({ apply: args.has('--apply') }).catch((error) => {
        console.error('Reset failed:', error);
        process.exitCode = 1;
    });
}

module.exports = {
    buildAuditRows,
    run
};
