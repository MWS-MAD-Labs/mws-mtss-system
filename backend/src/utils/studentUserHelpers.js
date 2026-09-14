const normalizeString = (value) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : undefined;
};

const normalizeEmail = (email) => {
    const cleaned = normalizeString(email);
    return cleaned ? cleaned.toLowerCase() : undefined;
};

// Central's exact Gender enum - validate-and-pass-through, not lowercase-
// and-reinterpret. An unrecognized value is left unset rather than silently
// coerced to a guessed default, so a schema drift in Central surfaces as a
// warning here instead of quietly mislabeling someone.
const VALID_GENDERS = new Set(['MALE', 'FEMALE']);
const normalizeGender = (gender) => {
    const value = normalizeString(gender);
    if (!value) return undefined;
    const upper = value.toUpperCase();
    if (VALID_GENDERS.has(upper)) return upper;
    console.warn(`normalizeGender: unrecognized Central gender value "${gender}" - leaving unset`);
    return undefined;
};

// Central's exact StudentStatus enum - same validate-and-pass-through
// posture as normalizeGender above.
const VALID_STATUSES = new Set(['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED']);
const normalizeStatus = (status) => {
    const value = normalizeString(status);
    if (!value) return undefined;
    const upper = value.toUpperCase();
    if (VALID_STATUSES.has(upper)) return upper;
    console.warn(`normalizeStatus: unrecognized Central status value "${status}" - leaving unset`);
    return undefined;
};

const deriveUnitFromGrade = (currentGrade, className) => {
    const gradeValue = normalizeString(currentGrade) || '';
    const classValue = normalizeString(className) || '';
    const combined = `${gradeValue} ${classValue}`.toLowerCase();

    if (combined.includes('kindergarten') || combined.includes('pre-k') || combined.includes('k1') || combined.includes('k2')) {
        return { unit: 'Kindergarten', department: 'Kindergarten' };
    }

    if (combined.includes('junior high') || combined.includes('grade 7') || combined.includes('grade 8') || combined.includes('grade 9')) {
        return { unit: 'Junior High', department: 'Junior High' };
    }

    if (combined.includes('grade 1') || combined.includes('grade 2') || combined.includes('grade 3')
        || combined.includes('grade 4') || combined.includes('grade 5') || combined.includes('grade 6')) {
        return { unit: 'Elementary', department: 'Elementary' };
    }

    return {};
};

const buildStudentUserPayload = ({
    email,
    name,
    nickname,
    gender,
    status,
    currentGrade,
    className,
    joinAcademicYear,
    googleId,
    googleProfile
}) => {
    const normalizedEmail = normalizeEmail(email);
    const username = normalizedEmail ? normalizedEmail.split('@')[0] : undefined;
    const unitInfo = deriveUnitFromGrade(currentGrade, className);

    return {
        email: normalizedEmail,
        name: normalizeString(name),
        role: 'student',
        username,
        nickname: normalizeString(nickname),
        gender: normalizeGender(gender),
        status: normalizeStatus(status),
        currentGrade: normalizeString(currentGrade),
        className: normalizeString(className),
        joinAcademicYear: normalizeString(joinAcademicYear),
        ...unitInfo,
        googleId: normalizeString(googleId),
        googleProfile: googleProfile || undefined
    };
};

module.exports = {
    normalizeString,
    normalizeEmail,
    normalizeGender,
    normalizeStatus,
    deriveUnitFromGrade,
    buildStudentUserPayload
};
