import { useCallback, useMemo } from "react";
import {
    deriveTeacherSegments,
    normalizeGradeLabel,
    normalizeClassLabel,
    buildGradeQueryValues,
    buildClassQueryValues,
} from "../utils/teacherDashboardUtils";
import {
    JUNIOR_HIGH_GRADES,
    isKindergartenLabel,
    isSpecificKindergartenVariant,
    isJuniorHighPrincipal,
} from "../utils/adminDashboardDataUtils";

const useAdminDashboardSegments = (user) => {
    const segments = useMemo(() => deriveTeacherSegments(user), [user]);
    const effectiveSegments = useMemo(() => {
        if (isJuniorHighPrincipal(user)) {
            return {
                ...segments,
                allowedGrades: JUNIOR_HIGH_GRADES,
                allowedClasses: [],
            };
        }
        return segments;
    }, [segments, user]);

    const gradeQueryValues = useMemo(() => buildGradeQueryValues(effectiveSegments), [effectiveSegments]);
    const classQueryValues = useMemo(() => buildClassQueryValues(effectiveSegments), [effectiveSegments]);
    const hasKindergartenWildcard = useMemo(
        () =>
            (effectiveSegments.allowedGrades || []).some(
                (grade) => isKindergartenLabel(grade) && !isSpecificKindergartenVariant(grade),
            ),
        [effectiveSegments.allowedGrades],
    );

    const withinSegments = useCallback(
        (student = {}) => {
            const allowedClasses = effectiveSegments.allowedClasses || [];
            if (!effectiveSegments.allowedGrades.length && !allowedClasses.length) return true;
            const gradeLabel = normalizeGradeLabel(
                student.grade || student.currentGrade || student.className || student.unit || student.classes?.[0]?.grade,
            );
            const classLabel = normalizeClassLabel(student.className || student.currentGrade);
            const matchesGrade =
                !effectiveSegments.allowedGrades.length ||
                effectiveSegments.allowedGrades.includes(gradeLabel) ||
                (hasKindergartenWildcard && isKindergartenLabel(gradeLabel));
            const matchesClass = !allowedClasses.length || (classLabel && allowedClasses.includes(classLabel));
            if (matchesGrade && matchesClass) {
                return true;
            }
            return false;
        },
        [effectiveSegments, hasKindergartenWildcard],
    );

    const transformStudent = useCallback((student = {}) => {
        const gradeLabel = normalizeGradeLabel(
            student.grade || student.currentGrade || student.className || student.unit || student.classes?.[0]?.grade,
        );
        const classLabel = normalizeClassLabel(
            student.className || student.currentGrade || student.unit || student.classes?.[0]?.grade,
        );
        return {
            ...student,
            grade: gradeLabel || student.grade,
            className: classLabel || student.className || student.currentGrade || student.unit || student.classes?.[0]?.grade,
        };
    }, []);

    const mentorMatchesSegments = useCallback(
        (mentor = {}) => {
            if (!effectiveSegments.allowedGrades.length && !effectiveSegments.unit) {
                return true;
            }
            const mentorSegments = deriveTeacherSegments(mentor);
            if (effectiveSegments.allowedGrades.length && mentorSegments.allowedGrades?.length) {
                if (mentorSegments.allowedGrades.some((grade) => effectiveSegments.allowedGrades.includes(grade))) {
                    return true;
                }
            }
            if (effectiveSegments.unit && mentor.unit) {
                return mentor.unit.toLowerCase() === effectiveSegments.unit.toLowerCase();
            }
            return !effectiveSegments.allowedGrades.length;
        },
        [effectiveSegments],
    );

    return {
        segments,
        effectiveSegments,
        gradeQueryValues,
        classQueryValues,
        withinSegments,
        transformStudent,
        mentorMatchesSegments,
    };
};

export default useAdminDashboardSegments;
