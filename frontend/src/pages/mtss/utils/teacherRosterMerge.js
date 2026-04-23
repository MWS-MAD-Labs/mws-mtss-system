import { normalizeGradeLabel, normalizeClassLabel } from "./teacherGradeUtils";
import { slugify } from "./teacherCommonUtils";
import { TIER_PRIORITY } from "./teacherMappingConstants";
import { normalizeTierCode } from "./teacherMappingHelpers";

const matchesGrade = (grade, allowedGrades = []) => {
    if (!allowedGrades.length) return true;
    const normalized = normalizeGradeLabel(grade);
    return allowedGrades.some((allowed) => {
        const normalizedAllowed = normalizeGradeLabel(allowed);
        return normalized === normalizedAllowed || normalized.startsWith(normalizedAllowed);
    });
};

const matchesClass = (className, allowedClasses = [], strictClassFilter = false) => {
    if (!strictClassFilter || !allowedClasses.length) return true;
    if (!className) return false;

    const normalized = normalizeClassLabel(className);
    return allowedClasses.some((allowed) => {
        const normalizedAllowed = normalizeClassLabel(allowed);
        return (
            normalized === normalizedAllowed ||
            normalized.endsWith(normalizedAllowed) ||
            normalized.endsWith(`- ${normalizedAllowed}`)
        );
    });
};

export const mergeRosterWithAssignments = (
    rosterStudents = [],
    assignmentStudents = [],
    segments = { allowedGrades: [] }
) => {
    const assignmentMap = new Map(
        assignmentStudents.map((student) => [student.id?.toString?.() || student.slug || student.name, student]),
    );

    const allowedGrades = segments.allowedGrades || [];
    const allowedClasses = segments.allowedClasses || [];
    const strictClassFilter = segments.strictClassFilter;

    const merged = rosterStudents
        .map((student) => {
            const id = student.id?.toString?.() || student._id?.toString?.() || student.slug || student.name;
            const gradeLabel = normalizeGradeLabel(student.grade || student.currentGrade || student.className || "-");
            const classLabel = normalizeClassLabel(student.className || student.currentGrade || student.unit);

            if (!matchesGrade(gradeLabel, allowedGrades)) return null;
            if (!matchesClass(classLabel, allowedClasses, strictClassFilter)) return null;

            const assignment = assignmentMap.get(id);
            const rosterTierCode = normalizeTierCode(student.tier || student.primaryIntervention?.tier || student.profile?.tier);
            const assignmentTierCode = normalizeTierCode(assignment?.tier);
            const rosterScore = TIER_PRIORITY[rosterTierCode] || 0;
            const assignmentScore = TIER_PRIORITY[assignmentTierCode] || 0;
            const useAssignment = assignment && (!rosterScore || assignmentScore > rosterScore);
            const displaySource = useAssignment ? assignment : student;
            const assignmentOptions = assignment?.assignmentOptions || [];

            return {
                id,
                slug: student.slug || slugify(student.name),
                name: student.name,
                grade: gradeLabel,
                className: classLabel || student.className,
                type: displaySource?.type || student.type || "Universal Supports",
                tier: displaySource?.tier || student.tier || "Tier 1",
                progress: displaySource?.progress || student.progress || "Not Assigned",
                nextUpdate: displaySource?.nextUpdate || student.nextUpdate || "Not scheduled",
                lastUpdate: displaySource?.lastUpdate || student.lastUpdate || null,
                assignmentId: assignment?.assignmentId || null,
                assignmentOptions,
                profile: displaySource?.profile || assignment?.profile || student.profile,
                interventions: student.interventions,
                primaryIntervention: student.primaryIntervention,
            };
        })
        .filter(Boolean);

    if (!merged.length && assignmentStudents.length) return assignmentStudents;
    return merged;
};
