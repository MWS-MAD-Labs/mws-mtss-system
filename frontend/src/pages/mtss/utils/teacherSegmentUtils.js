/**
 * Teacher segment derivation utilities
 */

import {
    normalizeGradeLabel,
    normalizeClassLabel,
} from "./teacherGradeUtils";
import { UNIT_GRADE_MAP } from "./teacherSegmentConstants";

const CLASS_SCOPED_UNITS = new Set(["elementary", "kindergarten", "pelangi"]);

// Trusts Central's real class name as-is (via user.classes, synced by
// teacherClassAssignmentSync.js) - no local guessing/fallback list. A
// teacher with no synced assignment yet just gets an empty set here, which
// falls back to grade-level scoping below rather than a made-up class.
const collectClassNames = (user = {}) => {
    const classes = new Set();
    (user.classes || []).forEach((cls) => {
        if (cls?.className) {
            const normalized = normalizeClassLabel(cls.className);
            if (normalized) classes.add(normalized);
        }
    });

    return Array.from(classes).filter(Boolean);
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
    let source = "all";
    let candidates = [];

    if (fromClasses.length) {
        source = "classes";
        candidates = fromClasses;
    } else if (fromJob.length) {
        source = "job";
        candidates = fromJob;
    } else if (unitGrades.length) {
        source = "unit";
        candidates = unitGrades;
    }

    let allowedGrades = Array.from(new Set(candidates.map(normalizeGradeLabel).filter(Boolean)));
    const lowerUnit = (user?.unit || "").toLowerCase();

    // A JH subject specialist whose class label has no grade number (e.g.
    // "Junior High - Coding") produces a bare "Junior High" candidate here,
    // which never matches /^grade\s*\d+/ below - so hasSpecificGrade is
    // false and the unitGrades fallback already expands it to Grade 7/8/9.
    // (Verified: a per-name allowlist used to sit here for two JH teachers
    // whose labels have no grade number; it produced the identical
    // allowedGrades to this plain path, and missed a third teacher with the
    // same "Junior High - <subject>" pattern who was never added to it.)
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
