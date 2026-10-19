// Moves every id that pointed at the old users (User, UserStudent) over to the same person in Central's list.
// The matching is by email. These helpers have no database in them, scripts/migratePeople.js does the reading and writing.

// Fields that hold a user id without declaring a ref in the schema.
const UNDECLARED_USER_FIELDS = [
    ['AIAssistantFeedback', 'userId'],
    ['StudentAIAssistantProfile', 'userId'],
    ['StudentLearningTwin', 'userId'],
];

const refOf = (type) => type.options?.ref || type.caster?.options?.ref || type.options?.type?.[0]?.ref;

function collectPersonPaths(schema, prefix = '', found = []) {
    schema.eachPath((path, type) => {
        const full = `${prefix}${path}`;
        if (type.schema) return collectPersonPaths(type.schema, `${full}.`, found);
        if (refOf(type) === 'Person') found.push(full);
        return undefined;
    });
    return found;
}

// Every place a model keeps a person id: [{ model, collection, path }].
function migrationTargets(models) {
    const targets = [];
    for (const [name, model] of Object.entries(models)) {
        // A person's own links (reports to, subordinates) are written by the sync, not mapped.
        if (name === 'Person') continue;
        const paths = collectPersonPaths(model.schema);
        UNDECLARED_USER_FIELDS.filter(([modelName]) => modelName === name).forEach(([, path]) => paths.push(path));
        paths.forEach((path) => targets.push({ model: name, collection: model.collection.name, path }));
    }
    return targets;
}

// Walks a document along a path like "planChangeLog.changedBy", across arrays, and yields the concrete path
// ("planChangeLog.2.changedBy") with the value found there.
function* findValues(node, segments, trail = []) {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
        for (let index = 0; index < node.length; index += 1) {
            yield* findValues(node[index], segments, [...trail, index]);
        }
        return;
    }
    if (!segments.length) {
        yield { path: trail.join('.'), value: node };
        return;
    }
    const [head, ...rest] = segments;
    yield* findValues(node[head], rest, [...trail, head]);
}

// The $set that turns the old ids in one document into the new ones, and the old ids nobody could be found for.
function remapDocument(doc, fieldPath, idMap) {
    const set = {};
    const missing = [];
    for (const { path, value } of findValues(doc, fieldPath.split('.'))) {
        const key = String(value);
        if (idMap.has(key)) set[path] = idMap.get(key);
        else missing.push(key);
    }
    return { set, missing };
}

module.exports = { migrationTargets, findValues, remapDocument, UNDECLARED_USER_FIELDS };
