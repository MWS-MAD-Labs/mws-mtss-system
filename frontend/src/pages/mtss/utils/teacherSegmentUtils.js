/**
 * Teacher segment derivation utilities
 */

import {
    normalizeGradeLabel,
    normalizeClassLabel,
    KINDERGARTEN_CLASSES,
} from "./teacherGradeUtils";
import { FALLBACK_GRADE_MAP, UNIT_GRADE_MAP } from "./teacherSegmentConstants";

const JH_GRADE_WIDE_EXCEPTION_USERS = new Set(["himawan", "hasan"]);
const CLASS_SCOPED_UNITS = new Set(["elementary", "kindergarten", "pelangi"]);

const collectClassNames = (user = {}) => {
    const classes = new Set();
    (user.classes || []).forEach((cls) => {
        if (cls?.className) {
            const normalized = normalizeClassLabel(cls.className);
            const lower = cls.className.toLowerCase();
            const mentionsKindyBand = /kindy|kindergarten|pre[-\s]?k|k\s*1|k\s*2/.test(lower);
            const isGenericKindy = normalized.toLowerCase() === "kindergarten" || !normalized.startsWith("Kindergarten -");
            if (mentionsKindyBand && isGenericKindy) {
                KINDERGARTEN_CLASSES.forEach((className) => classes.add(className));
            } else if (normalized) {
                classes.add(normalized);
            }
        }
    });

    const unit = (user.unit || "").toLowerCase();
    if (!classes.size && (unit === "kindergarten" || unit === "pelangi")) {
        KINDERGARTEN_CLASSES.forEach((className) => classes.add(className));
    }

    return Array.from(classes).filter(Boolean);
};

const resolveFallbackGrades = (user = {}) => {
    const candidates = [];
    if (user.username) candidates.push(user.username.toLowerCase());
    if (user.name) {
        candidates.push(user.name.toLowerCase());
        const firstToken = user.name.split(/[\s,]+/)[0];
        if (firstToken) candidates.push(firstToken.toLowerCase());
    }
    if (user.email) {
        const localPart = user.email.split("@")[0];
        if (localPart) candidates.push(localPart.toLowerCase());
    }
    for (const candidate of candidates) {
        if (FALLBACK_GRADE_MAP[candidate]) return FALLBACK_GRADE_MAP[candidate];
    }
    return [];
};

const parseJobPositionGrades = (jobPosition = "") => {
    if (!jobPosition) return [];
    const matches = [];
    const gradeMatches = jobPosition.match(/grade\s*\d+/gi);
    if (gradeMatches) {
        gradeMatches.forEach((g) => matches.push(g.trim().replace(/\s+/g, " ").replace(/grade/i, "Grade").trim()));
    }
    if (/kindy|kindergarten/i.test(jobPosition)) {
        const kindyMatch = jobPosition.match(/kindy\s*[a-z0-9'\-\s]+/i);
        if (kindyMatch) {
            matches.push(kindyMatch[0].trim());
        } else {
            matches.push("Kindergarten Pre-K", "Kindergarten K1", "Kindergarten K2");
        }
    }
    return matches;
};

export const deriveTeacherSegments = (user = {}) => {
    const classGrades = Array.isArray(user?.classes) ? user.classes : [];
    const fromClasses = classGrades.map((cls) => normalizeGradeLabel(cls.grade)).filter(Boolean);
    const fromJob = parseJobPositionGrades(user?.jobPosition).map(normalizeGradeLabel).filter(Boolean);
    const unitGrades = UNIT_GRADE_MAP[user?.unit] || [];
    const key = (user?.username || user?.name || "").toLowerCase();
    const fallbackGradesExplicit = FALLBACK_GRADE_MAP[key] || [];
    const fallbackGrades = fallbackGradesExplicit.length ? fallbackGradesExplicit : resolveFallbackGrades(user);
    let source = "all";
    let candidates = [];

    if (fromClasses.length) {
        source = "classes";
        candidates = fromClasses;
    } else if (fromJob.length) {
        source = "job";
        candidates = fromJob;
    } else if (fallbackGrades.length) {
        source = "fallback";
        candidates = fallbackGrades;
    } else if (unitGrades.length) {
        source = "unit";
        candidates = unitGrades;
    }

    let allowedGrades = Array.from(new Set(candidates.map(normalizeGradeLabel).filter(Boolean)));
    const lowerUsername = (user?.username || "").toLowerCase().trim();
    const lowerName = (user?.name || "").toLowerCase().trim();
    const lowerUnit = (user?.unit || "").toLowerCase();
    const isJhWideException =
        lowerUnit === "junior high" &&
        (JH_GRADE_WIDE_EXCEPTION_USERS.has(lowerUsername) ||
            JH_GRADE_WIDE_EXCEPTION_USERS.has(lowerName) ||
            lowerName.includes("himawan") ||
            lowerName.includes("hasan"));

    if (isJhWideException && UNIT_GRADE_MAP["Junior High"]?.length) {
        allowedGrades = UNIT_GRADE_MAP["Junior High"].slice();
        source = "jh-exception";
    }

    const hasSpecificGrade = allowedGrades.some(
        (grade) => /^grade\s*\d+/i.test(grade) || grade.toLowerCase().startsWith("kindergarten") || grade.toLowerCase().startsWith("kindy")
    );

    if (!hasSpecificGrade && unitGrades.length) {
        allowedGrades = unitGrades.slice();
    }

    const classNameSet = new Set(collectClassNames(user));
    const lowerJobPosition = (user?.jobPosition || "").toLowerCase();
    const classScopedByRole =
        lowerJobPosition.includes("homeroom") ||
        lowerJobPosition.includes("special education") ||
        (user?.classes || []).some((cls) => {
            const role = (cls?.role || "").toLowerCase();
            return role.includes("homeroom") || role.includes("special education");
        });
    const shouldUseClassScopedRoster = CLASS_SCOPED_UNITS.has(lowerUnit) && classScopedByRole;

    if ((lowerUnit === "kindergarten" || lowerUnit === "pelangi") && !allowedGrades.some((grade) => grade.toLowerCase() === "kindergarten")) {
        allowedGrades.push("Kindergarten");
    }

    if ((lowerUnit === "kindergarten" || lowerUnit === "pelangi") && !classNameSet.size) {
        KINDERGARTEN_CLASSES.forEach((className) => classNameSet.add(className));
    }

    // Teacher dashboard roster uses grade-wide visibility for all teaching roles
    // in JH, while Elementary/Kindy homeroom + SE teachers are class-scoped.
    const strictClassFilter = shouldUseClassScopedRoster && classNameSet.size > 0;
    const normalizedClasses = strictClassFilter ? Array.from(classNameSet) : [];
    const shouldFilterServer = Boolean(allowedGrades.length) || Boolean(normalizedClasses.length);

    return {
        allowedGrades,
        allowedClasses: normalizedClasses,
        strictClassFilter,
        source,
        shouldFilterServer,
        unit: user?.unit || "",
        label: allowedGrades.length ? allowedGrades.join(", ") : user?.unit || "All Grades",
    };
};

export { FALLBACK_GRADE_MAP };
