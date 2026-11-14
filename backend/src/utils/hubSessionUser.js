const Person = require('../models/Person');
const { lookupApplicationEntitlement } = require('../services/mwsDataCenterClient');
const { validateEntitlement } = require('./centralEntitlement');
const { resolveOrProvisionPerson } = require('./personResolution');

// What Central says a person may do here is kept for a minute, so a change there shows up within that time and
// most requests do not need Central at all.
const ENTITLEMENT_TTL_MS = 60 * 1000;
const entitlements = new Map();

async function currentEntitlement(personId) {
    const cached = entitlements.get(personId);
    if (cached && Date.now() - cached.at < ENTITLEMENT_TTL_MS) return cached.value;

    const found = await lookupApplicationEntitlement(personId);
    let value = null;
    if (found && found.is_active) {
        try {
            value = validateEntitlement({
                id: found.id,
                application_id: found.application_id,
                organization_id: found.organization_id,
                role: found.role,
                permissions: found.permissions,
                version: found.version,
            });
        } catch (error) {
            console.error('Central entitlement is not usable here:', error.message);
        }
    }
    entitlements.set(personId, { at: Date.now(), value });
    return value;
}

// The person behind a verified Hub token, or null when they have no access to this application.
// Throws when Central cannot be asked, so a caller can tell "no access" from "try again".
async function resolveSessionUser(claims) {
    const entitlement = await currentEntitlement(claims.sub);
    if (!entitlement) return null;

    const person = await Person.findOne({ centralPersonId: claims.sub });
    if (
        person
        && person.isActive
        && person.centralEntitlementId === entitlement.id
        && Number(person.centralEntitlementVersion) === entitlement.version
    ) {
        return person;
    }
    // First visit, or Central changed what they may do: bring the local record in line.
    return resolveOrProvisionPerson(claims.email, {
        source: claims.source,
        personId: claims.sub,
        entitlement,
    });
}

function clearEntitlementCache() {
    entitlements.clear();
}

module.exports = { resolveSessionUser, clearEntitlementCache };
