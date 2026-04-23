const SUBJECT_ALIAS_MAP = {
    english: ["english", "bahasa inggris", "ela", "reading", "literacy", "ela/reading"],
    math: ["math", "mathematics", "numeracy"],
    behavior: ["behavior", "behaviour", "conduct"],
    sel: ["sel", "social emotional", "social-emotional", "behavior"],
    attendance: ["attendance", "engagement", "present", "absence", "absent"],
    indonesian: ["indonesian", "bahasa indonesia", "bahasa", "bi"],
    universal: ["universal", "all", "schoolwide", "whole school"],
};
const EDITABLE_STATUSES = new Set(["active", "paused", "monitoring", "on track"]);

const readBooleanFlag = (assignmentOption = {}, directKey = "", nestedKey = "") => {
    if (typeof assignmentOption?.[directKey] === "boolean") return assignmentOption[directKey];
    if (typeof assignmentOption?.viewerPermissions?.[nestedKey] === "boolean") {
        return assignmentOption.viewerPermissions[nestedKey];
    }
    return undefined;
};

const normalizeText = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const normalizeGradeToken = (value = "") => {
    const normalized = normalizeText(value);
    const gradeMatch = normalized.match(/grade\s*([0-9]{1,2})/i);
    if (gradeMatch) return `grade-${gradeMatch[1]}`;
    if (/^[0-9]{1,2}$/.test(normalized)) return `grade-${normalized}`;
    if (normalized.includes("pre-k") || normalized.includes("prek")) return "kindy-prek";
    if (normalized.includes("k1")) return "kindy-k1";
    if (normalized.includes("k2")) return "kindy-k2";
    if (normalized.includes("kindergarten")) return "kindy";
    return normalized;
};

const BROAD_GRADE_SCOPES = new Set([
    "junior high",
    "middle school",
    "secondary",
    "high school",
    "elementary",
    "kindergarten",
    "all grades",
    "all grade",
    "all students",
    "all",
]);

const isBroadGradeScope = (value = "") => BROAD_GRADE_SCOPES.has(normalizeText(value));

const normalizeClassToken = (value = "") => {
    const normalized = normalizeText(value);
    if (!normalized) return "";
    const parts = normalized.split("-").map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) return parts[parts.length - 1];
    return normalized.replace(/grade\s*[0-9]{1,2}/g, "").trim() || normalized;
};

const normalizeTierCode = (value = "") => {
    const normalized = normalizeText(value).replace(/\s+/g, "");
    if (!normalized) return "";
    if (normalized === "3" || normalized.includes("tier3")) return "tier3";
    if (normalized === "2" || normalized.includes("tier2")) return "tier2";
    if (normalized === "1" || normalized.includes("tier1")) return "tier1";
    return normalized;
};

const canonicalizeSubjectKey = (value = "") => {
    const normalized = normalizeText(value);
    if (!normalized) return null;

    for (const [canonical, aliases] of Object.entries(SUBJECT_ALIAS_MAP)) {
        if (normalized === canonical) return canonical;
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized))) {
            return canonical;
        }
    }

    return normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

const isGenericClassLabel = (value = "") => {
    const normalized = normalizeText(value);
    if (!normalized) return true;

    if (
        normalized.includes("homeroom") ||
        normalized.includes("class teacher") ||
        normalized.includes("special education") ||
        normalized.includes("subject teacher") ||
        normalized === "subject" ||
        normalized === "all"
    ) {
        return true;
    }

    const canonical = canonicalizeSubjectKey(value);
    return Boolean(canonical && Object.prototype.hasOwnProperty.call(SUBJECT_ALIAS_MAP, canonical));
};

const roleIncludes = (value = "", keyword = "") => normalizeText(value).includes(normalizeText(keyword));

const isHomeroomRole = (value = "") => {
    const normalized = normalizeText(value);
    return normalized.includes("homeroom") || normalized.includes("class teacher");
};

const isSubjectRole = (value = "") => {
    const normalized = normalizeText(value);
    if (!normalized) return false;
    return normalized.includes("subject") || normalized === "teacher" || normalized.includes("grade teacher");
};

const gradeMatches = (classGrade = "", student = {}) => {
    if (!classGrade) return true;
    if (isBroadGradeScope(classGrade)) return true;
    const studentCandidates = [student?.grade, student?.currentGrade, student?.className].filter(Boolean);
    const classGradeKey = normalizeGradeToken(classGrade);
    return studentCandidates.some((candidate) => normalizeGradeToken(candidate) === classGradeKey);
};

const classMatches = (className = "", student = {}, { allowGenericLabel = false } = {}) => {
    if (!className) return true;
    if (allowGenericLabel && isGenericClassLabel(className)) return true;
    const classToken = normalizeClassToken(className);
    if (!classToken) return true;

    const studentCandidates = [student?.className, student?.grade, student?.currentGrade].filter(Boolean);
    return studentCandidates.some((candidate) => {
        const candidateToken = normalizeClassToken(candidate);
        return candidateToken === classToken || candidateToken.includes(classToken) || classToken.includes(candidateToken);
    });
};

const resolveAssignmentSubjectKeys = (assignmentOption = {}) => {
    const candidates = [
        assignmentOption?.focus,
        ...(Array.isArray(assignmentOption?.focusAreas) ? assignmentOption.focusAreas : []),
        assignmentOption?.strategyName,
    ].filter(Boolean);

    const keys = Array.from(new Set(candidates.map((value) => canonicalizeSubjectKey(value)).filter(Boolean)));
    return keys.length ? keys : ["universal"];
};

const resolveClassSubjectKeys = (classAssignment = {}) => {
    const candidates = [classAssignment?.subject, classAssignment?.className].filter(Boolean);
    return Array.from(new Set(candidates.map((value) => canonicalizeSubjectKey(value)).filter(Boolean)));
};

const isEditableAssignmentStatus = (status = "") => {
    const normalized = normalizeText(status);
    if (!normalized) return true;
    return EDITABLE_STATUSES.has(normalized);
};

const isEscalatedAssignment = (option = {}) => {
    const tierCode = normalizeTierCode(option?.tierCode || option?.tier || option?.tierValue);
    return tierCode === "tier2" || tierCode === "tier3";
};

const getCandidateAssignmentOptions = (student = {}) =>
    Array.isArray(student.assignmentOptions)
        ? student.assignmentOptions.filter((option) => option?.assignmentId && isEditableAssignmentStatus(option?.statusKey || option?.status))
        : [];

export const canUserSubmitProgressForAssignment = (assignmentOption = {}) => {
    if (!assignmentOption?.assignmentId) return false;
    if (!isEditableAssignmentStatus(assignmentOption?.statusKey || assignmentOption?.status)) return false;
    const explicit = readBooleanFlag(assignmentOption, "viewerCanSubmitProgress", "canSubmitProgress");
    return explicit === true;
};

export const getProgressAssignmentOptions = (student = {}) =>
    getCandidateAssignmentOptions(student).filter((option) => canUserSubmitProgressForAssignment(option));

export const resolveProgressAssignmentForStudent = (student = {}) => {
    const options = getProgressAssignmentOptions(student);
    if (!options.length) return null;

    const escalated = options.filter((option) => isEscalatedAssignment(option));
    return escalated[0] || options[0];
};

export const resolveEditableAssignmentOption = (student = {}) => {
    const options = getCandidateAssignmentOptions(student);
    if (options.length) {
        const escalated = options.filter((option) => isEscalatedAssignment(option));
        return escalated[0] || null;
    }

    if (!student.assignmentId || !isEscalatedAssignment(student)) return null;
    return {
        assignmentId: student.assignmentId,
        focus: student.type || "Focused Support",
        tier: student.tier || "Tier 2",
        tierCode: normalizeTierCode(student?.tier) || "tier2",
        statusKey: normalizeText(student?.statusKey || student?.progress || "active"),
    };
};

export const canUserEditPlanForStudent = (user = {}, student = {}, assignmentOption = resolveEditableAssignmentOption(student)) => {
    if (!assignmentOption?.assignmentId) return false;

    const explicit = readBooleanFlag(assignmentOption, "viewerCanEditPlan", "canEditPlan");
    if (typeof explicit === "boolean") return explicit;

    const assignments = Array.isArray(user?.classes) ? user.classes : [];
    if (!assignments.length) return false;

    const subjectKeys = resolveAssignmentSubjectKeys(assignmentOption);

    const homeroomMatch = assignments.some((classAssignment) => {
        const role = classAssignment?.role || user?.jobPosition || "";
        if (!isHomeroomRole(role)) return false;
        if (!classAssignment?.grade && !classAssignment?.className) return false;
        return (
            gradeMatches(classAssignment?.grade, student) &&
            classMatches(classAssignment?.className, student, { allowGenericLabel: true })
        );
    });

    if (homeroomMatch) return true;

    if (subjectKeys.includes("universal")) return false;

    return assignments.some((classAssignment) => {
        const role = classAssignment?.role || user?.jobPosition || "";
        if (!isSubjectRole(role) && !roleIncludes(user?.jobPosition, "subject")) return false;
        if (!classAssignment?.grade && !classAssignment?.className) return false;
        if (
            !gradeMatches(classAssignment?.grade, student) ||
            !classMatches(classAssignment?.className, student, { allowGenericLabel: true })
        ) {
            return false;
        }

        const classSubjects = resolveClassSubjectKeys(classAssignment);
        if (!classSubjects.length) return false;
        return classSubjects.some((subjectKey) => subjectKeys.includes(subjectKey));
    });
};

export const resolveEditableAssignmentForUser = (user = {}, student = {}) => {
    const options = getCandidateAssignmentOptions(student);
    if (!options.length) return null;

    const editableOptions = options.filter((option) => canUserEditPlanForStudent(user, student, option));
    if (!editableOptions.length) return null;

    const escalatedEditable = editableOptions.filter((option) => isEscalatedAssignment(option));
    return escalatedEditable[0] || editableOptions[0];
};

export const formatPlanAuditDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsed);
};
