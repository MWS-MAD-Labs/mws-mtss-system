const Person = require('../models/Person');
const { PERSON_TYPE, CENTRAL_STATUS } = require('../constants/person');
const { normalizeEmail } = require('./studentUserHelpers');
const { syncEmployeeFromCentral } = require('./employeeCentralSync');
const { syncStudentFromCentral } = require('./studentCentralSync');
const { applyEntitlementProjection } = require('./centralEntitlement');

// Asks Central whether this person is an employee or a student and returns the fields to keep, or null when
// Central has no active record of that kind. A lookup that fails is not an answer: the error goes up so the
// caller can tell "not found" from "could not check" (only a failed student lookup is forgiven, see below).
async function lookupAs(personType, email) {
    return personType === PERSON_TYPE.STUDENT
        ? syncStudentFromCentral(email)
        : syncEmployeeFromCentral(email);
}

// The person behind a verified Hub token, made or brought up to date from Central. `claims` carries what the
// token says: source (the Hub's own answer: employee or student), personId, and the entitlement Central gave.
// Returns null when Central knows the person as neither.
async function resolveOrProvisionPerson(rawEmail, claims = {}) {
    const email = normalizeEmail(rawEmail);
    if (!email) return null;

    const personId = claims.personId || null;
    // The Hub already looked this up when it signed the token, so its answer is tried first. The other kind is
    // still tried when it comes up empty, so a stale hint corrects itself.
    const order = claims.source === PERSON_TYPE.EMPLOYEE
        ? [PERSON_TYPE.EMPLOYEE, PERSON_TYPE.STUDENT]
        : [PERSON_TYPE.STUDENT, PERSON_TYPE.EMPLOYEE];

    let existing = personId ? await Person.findOne({ centralPersonId: personId }) : null;
    if (!existing) existing = await Person.findOne({ email });

    let found = null;
    for (const personType of order) {
        try {
            const fields = await lookupAs(personType, email);
            if (fields) {
                found = { personType, fields };
                break;
            }
        } catch (error) {
            // A student lookup that fails is "could not check", not "not a student": an account we already
            // know as a student stays as it is instead of being turned away over a network hiccup.
            if (personType === PERSON_TYPE.STUDENT && existing?.personType === PERSON_TYPE.STUDENT) {
                found = { personType, fields: {} };
                break;
            }
            if (personType === PERSON_TYPE.STUDENT) continue;
            throw error;
        }
    }
    if (!found) return null;

    const person = existing || new Person();
    Object.assign(person, found.fields, {
        email,
        personType: found.personType,
        isActive: true,
        centralStatus: CENTRAL_STATUS.ACTIVE,
        lastLogin: new Date(),
    });
    if (personId) person.centralPersonId = personId;
    else if (!person.centralPersonId) person.centralPersonId = found.fields.centralPersonId;
    if (!person.name) person.name = email;

    if (claims.entitlement) {
        const sameEntitlement = person.centralEntitlementId === claims.entitlement.id;
        if (sameEntitlement && Number(person.centralEntitlementVersion || 0) > claims.entitlement.version) {
            throw new Error('Entitlement version is older than the local projection');
        }
        applyEntitlementProjection(person, claims.entitlement);
    }
    await person.save();
    return person;
}

module.exports = { resolveOrProvisionPerson };
