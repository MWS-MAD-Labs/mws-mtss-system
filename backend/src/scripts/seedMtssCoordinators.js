const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// MTSS Coordinators: staff who watch MTSS for some grades and change nothing. Safe to run again. Users that do not
// exist yet are reported and skipped, never created.
//
//   node src/scripts/seedMtssCoordinators.js --dry-run
//   node src/scripts/seedMtssCoordinators.js
// "Kindergarten" covers Pre-K, K1 and K2 and any class name under them.
const KINDERGARTEN = ['Kindergarten'];
const LOWER_ELEMENTARY = ['Grade 1', 'Grade 2', 'Grade 3'];
const UPPER_ELEMENTARY = ['Grade 4', 'Grade 5', 'Grade 6'];
const JUNIOR_HIGH = ['Grade 7', 'Grade 8', 'Grade 9'];

const COORDINATORS = [
    { email: 'putri.fitriyani@millennia21.id', gradeScope: [...KINDERGARTEN, ...LOWER_ELEMENTARY], note: 'MTSS Coordinator: Kindergarten and Lower Elementary' },
    { email: 'roma@millennia21.id', gradeScope: [...UPPER_ELEMENTARY, ...JUNIOR_HIGH], note: 'MTSS Coordinator: Upper Elementary and Junior High' },
    // To look at the Coordinator view in production. Same grades as Tr Putri.
    { email: 'dummyteacher@gmail.com', gradeScope: [...KINDERGARTEN, ...LOWER_ELEMENTARY], note: 'MTSS Coordinator: test account' }
];

const sameList = (a = [], b = []) => a.length === b.length && a.every((entry, index) => entry === b[index]);

// Returns what happened per entry: 'updated', 'unchanged' or 'not_found'. Writes only when dryRun is false.
const applyCoordinators = async ({ entries = COORDINATORS, dryRun = false, now = new Date() } = {}) => {
    const results = [];
    for (const entry of entries) {
        const email = entry.email.trim().toLowerCase();
        const user = await User.findOne({ email });
        if (!user) {
            results.push({ email, status: 'not_found' });
            continue;
        }
        const current = user.mtssAccess || {};
        const unchanged = current.enabled === true
            && current.accessLevel === 'coordinator'
            && sameList(Array.from(current.gradeScope || []), entry.gradeScope);
        if (unchanged) {
            results.push({ email, status: 'unchanged' });
            continue;
        }
        if (!dryRun) {
            user.mtssAccess = {
                enabled: true,
                accessLevel: 'coordinator',
                gradeScope: entry.gradeScope,
                note: entry.note,
                grantedAt: now
            };
            await user.save();
        }
        results.push({ email, status: 'updated', gradeScope: entry.gradeScope });
    }
    return results;
};

const main = async () => {
    const dryRun = process.argv.includes('--dry-run');
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const results = await applyCoordinators({ dryRun });
        results.forEach((row) => {
            const scope = row.gradeScope ? ` -> ${row.gradeScope.join(', ')}` : '';
            console.log(`${dryRun && row.status === 'updated' ? 'would update' : row.status}: ${row.email}${scope}`);
        });
        if (results.some((row) => row.status === 'not_found')) {
            console.log('Some users were not found. They need to exist in MTSS (sign in once, or be in the roster) first.');
        }
        if (dryRun) console.log('Dry run: nothing was written.');
    } finally {
        await mongoose.connection.close();
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { COORDINATORS, applyCoordinators };
