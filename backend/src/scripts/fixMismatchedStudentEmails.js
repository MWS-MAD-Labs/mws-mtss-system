// One-off fix for MTSSStudent records whose email has a typo relative to
// Central (missing "21", extra dot, wrong domain, or a stray zero-width
// character), so they were invisible to mtssStudentRosterSync.js's
// email-keyed sync entirely. Found via dryRunCentralStudentSync.js's
// "no matching Central record at all" section.
//
// For each known-bad email: try obvious domain-typo fixes, then confirm
// against Central's full roster by exact name match before touching
// anything. If a domain fix doesn't land on a real Central record, or the
// name doesn't match, it's printed for manual review instead of guessed.
//
// Usage: node src/scripts/fixMismatchedStudentEmails.js
require('dotenv').config();
const mongoose = require('mongoose');
const MTSSStudent = require('../models/MTSSStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');

const ALL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

// Strip zero-width/invisible characters that don't show up when an email
// is eyeballed but break exact-match lookups (see sakha.askaramurti below).
const stripInvisible = (value) => value.replace(/[​-‍﻿]/g, '');

// Mongoose's schema-level trim+lowercase runs on save but doesn't strip
// invisible characters mid-string, so KNOWN_BAD.current (typed here with
// the same invisible character the DB actually stores) must be looked up
// the same way - trim+lowercase only. Invisible-char stripping is only for
// producing the corrected replacement value, never for finding the record.
const normalizeForLookup = (value = '') => String(value || '').trim().toLowerCase();
const normalizeEmail = (value = '') => stripInvisible(String(value || '')).trim().toLowerCase();
const normalizeName = (value = '') => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

// The 6 flagged by dryRunCentralStudentSync.js's "no matching Central
// record at all" section. candidateEmail is the obvious typo-corrected
// guess; null means "no confident domain-typo guess, match by name only".
const KNOWN_BAD = [
    { current: 'alya.humaira@millennia.id', candidate: 'alya.humaira@millennia21.id' },
    { current: 'aqeela.rumaisha@millennia.id', candidate: 'aqeela.rumaisha@millennia21.id' },
    { current: 'sakha.askar​amurti@millennia21.id', candidate: 'sakha.askaramurti@millennia21.id' },
    { current: 'elliana.sitorus@millennia.21.id', candidate: 'elliana.sitorus@millennia21.id' },
    { current: 'keanussa.alnara@millenia21.id', candidate: 'keanussa.alnara@millennia21.id' },
    { current: 'kareem.mohammad@millennia21.id', candidate: null },
];

async function fetchCentralRoster() {
    const all = [];
    for (const status of ALL_STATUSES) {
        try {
            const students = await listStudentsByStatus(status);
            students.forEach((s) => all.push({ ...s, status }));
        } catch (error) {
            console.error(`⚠️  Failed to fetch Central students with status=${status}:`, error.message);
        }
    }
    return all;
}

async function run() {
    console.log('🔧 Fixing MTSSStudent records with typo\'d emails\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}`);

    const centralRoster = await fetchCentralRoster();
    const centralByEmail = new Map(centralRoster.map((s) => [normalizeEmail(s.email), s]));
    const centralByName = new Map();
    centralRoster.forEach((s) => {
        const key = normalizeName(s.full_name);
        if (!centralByName.has(key)) centralByName.set(key, []);
        centralByName.get(key).push(s);
    });
    console.log(`✓ Central roster: ${centralRoster.length} records\n`);

    for (const { current, candidate } of KNOWN_BAD) {
        const doc = await MTSSStudent.findOne({ email: normalizeForLookup(current) });
        if (!doc) {
            console.log(`  ? ${current} - no MTSSStudent record found (already fixed, or email differs from expected) - skipping`);
            continue;
        }

        const centralMatchByEmail = candidate ? centralByEmail.get(normalizeEmail(candidate)) : null;
        const nameMatches = centralByName.get(normalizeName(doc.name)) || [];

        let resolvedEmail = null;
        if (centralMatchByEmail) {
            resolvedEmail = normalizeEmail(candidate);
        } else if (nameMatches.length === 1) {
            resolvedEmail = normalizeEmail(nameMatches[0].email);
        }

        if (!resolvedEmail) {
            console.log(`  ✗ ${current} (${doc.name}) - could not confirm a Central match (candidate email: ${candidate || 'none'}, name matches in Central: ${nameMatches.length}) - needs manual review`);
            continue;
        }

        try {
            await MTSSStudent.updateOne({ _id: doc._id }, { $set: { email: resolvedEmail } });
            console.log(`  ✓ ${current} -> ${resolvedEmail} (${doc.name})`);
        } catch (error) {
            console.error(`  ✗ ${current} - failed to update: ${error.message}`);
        }
    }

    console.log('\n✅ Done. Run src/scripts/dryRunCentralStudentSync.js afterward to confirm these now sync cleanly.');
    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
