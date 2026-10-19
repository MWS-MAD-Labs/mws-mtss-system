// EMERGENCY TOOL. The normal move is `npm run migrate:people`, which copies the old users into "people" with the
// same _id, so nothing else has to change and going back is deploying the old code.
//
// This one is only for a database where the Central sync already made the people with new ids before that copy ran.
// It rewrites the old user ids kept in other collections (mentor, creator, check-ins, notifications and so on) to
// the new ids, matching by email. It changes those collections in place, so it CANNOT be undone by deploying the old
// code: back up first.
//   npm run migrate:people:refs                shows what would change, writes nothing
//   npm run migrate:people:refs -- --apply     writes it
// It can be run again safely and never touches the old user collections. Ids with no person behind them are listed
// and left as they were.
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { migrationTargets, remapDocument } = require('../utils/personMigration');

const apply = process.argv.includes('--apply');
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function readCollection(db, name) {
    const exists = await db.listCollections({ name }).hasNext();
    return exists ? db.collection(name).find({}, { projection: { email: 1 } }).toArray() : [];
}

async function buildIdMap(db) {
    const people = await db.collection('people').find({}, { projection: { email: 1 } }).toArray();
    const personByEmail = new Map(people.map((person) => [normalizeEmail(person.email), person._id]));

    const idMap = new Map();
    const noPerson = [];
    for (const name of ['users', 'userstudents']) {
        for (const old of await readCollection(db, name)) {
            const personId = personByEmail.get(normalizeEmail(old.email));
            if (personId) idMap.set(String(old._id), personId);
            else noPerson.push(old.email || String(old._id));
        }
    }
    return { idMap, noPerson, peopleCount: people.length };
}

async function main() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    fs.readdirSync(path.join(__dirname, '../models')).forEach((file) => require(`../models/${file}`));
    const targets = migrationTargets(mongoose.models);

    const { idMap, noPerson, peopleCount } = await buildIdMap(db);
    console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${peopleCount} people, ${idMap.size} old users matched by email, ${noPerson.length} without a person`);
    if (!peopleCount) throw new Error('The people collection is empty. Let the Central sync run first.');

    const unmatchedIds = new Map();
    let changedFields = 0;
    for (const target of targets) {
        const collection = db.collection(target.collection);
        const topField = target.path.split('.')[0];
        let fields = 0;
        let docs = 0;
        for await (const doc of collection.find({ [topField]: { $exists: true } })) {
            const { set, missing } = remapDocument(doc, target.path, idMap);
            missing.forEach((id) => unmatchedIds.set(id, (unmatchedIds.get(id) || 0) + 1));
            const count = Object.keys(set).length;
            if (!count) continue;
            fields += count;
            docs += 1;
            if (apply) await collection.updateOne({ _id: doc._id }, { $set: set });
        }
        changedFields += fields;
        if (fields) console.log(`  ${target.model}.${target.path}: ${fields} id(s) in ${docs} document(s)`);
    }

    // Ids that are neither an old user nor already a person (a student record, a deleted account).
    const peopleIds = new Set((await db.collection('people').find({}, { projection: { _id: 1 } }).toArray()).map((p) => String(p._id)));
    const orphaned = [...unmatchedIds.keys()].filter((id) => !peopleIds.has(id));

    console.log(`${apply ? 'Changed' : 'Would change'} ${changedFields} id(s).`);
    if (noPerson.length) console.log(`Old users with no person in Central (first 20): ${noPerson.slice(0, 20).join(', ')}`);
    if (orphaned.length) console.log(`${orphaned.length} id(s) point at neither an old user nor a person, left as they are.`);
    if (!apply) console.log('Nothing was written. Run again with --apply to write.');
}

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
