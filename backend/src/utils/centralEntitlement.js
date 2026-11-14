const { z } = require('zod');
const { PERMISSION_SET } = require('../constants/permissions');

// The ID this application has in Central. It is the name given when MTSS was added there.
const APP_ID = process.env.CENTRAL_APPLICATION_ID || 'mtss';

const entitlementSchema = z.object({
    id: z.string().trim().min(1),
    application_id: z.string().trim().min(1),
    organization_id: z.string().trim().min(1),
    role: z.string().trim().min(1),
    permissions: z.array(z.string().trim().min(1)).max(100),
    version: z.number().int().nonnegative(),
}).strict();

function expectedOrganizationId() {
    return process.env.CENTRAL_ORGANIZATION_ID;
}

function validateEntitlement(input, expectedOrganizationIdValue = expectedOrganizationId()) {
    if (!expectedOrganizationIdValue) {
        throw new Error('CENTRAL_ORGANIZATION_ID is not configured');
    }

    const entitlement = entitlementSchema.parse(input);
    if (entitlement.application_id !== APP_ID) {
        throw new Error('Entitlement is for another application');
    }
    if (entitlement.organization_id !== expectedOrganizationIdValue) {
        throw new Error('Entitlement organization does not match this deployment');
    }

    // A permission this version of the code does not know grants nothing. It is left out instead of locking the
    // whole role out, which is what a role still holding a removed permission would otherwise cause.
    const known = entitlement.permissions.filter((permission) => PERMISSION_SET.has(permission));

    return {
        ...entitlement,
        permissions: [...new Set(known)].sort(),
    };
}

function entitlementProjection(entitlement) {
    return {
        centralEntitlementId: entitlement.id,
        centralEntitlementApplicationId: entitlement.application_id,
        centralEntitlementOrganizationId: entitlement.organization_id,
        centralEntitlementRole: entitlement.role,
        centralEntitlementPermissions: entitlement.permissions,
        centralEntitlementVersion: entitlement.version,
        centralEntitlementUpdatedAt: new Date(),
    };
}

function projectionChanged(person, projection) {
    return person.centralEntitlementId !== projection.centralEntitlementId
        || person.centralEntitlementApplicationId !== projection.centralEntitlementApplicationId
        || person.centralEntitlementOrganizationId !== projection.centralEntitlementOrganizationId
        || person.centralEntitlementRole !== projection.centralEntitlementRole
        || Number(person.centralEntitlementVersion ?? -1) !== projection.centralEntitlementVersion
        || JSON.stringify([...(person.centralEntitlementPermissions || [])].sort()) !== JSON.stringify(projection.centralEntitlementPermissions);
}

function applyEntitlementProjection(person, entitlement) {
    const projection = entitlementProjection(entitlement);
    const changed = projectionChanged(person, projection);
    Object.assign(person, projection);
    return changed;
}

module.exports = {
    APP_ID,
    entitlementSchema,
    validateEntitlement,
    expectedOrganizationId,
    entitlementProjection,
    projectionChanged,
    applyEntitlementProjection,
};
