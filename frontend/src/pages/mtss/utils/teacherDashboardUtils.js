/**
 * Teacher Dashboard Utilities - Re-export barrel file
 * Split into smaller modules for maintainability
 */

// Grade and class normalization
export {
    normalizeGradeLabel,
    normalizeClassLabel,
    buildGradeQueryValues,
    buildClassQueryValues,
    KINDERGARTEN_GRADES,
    KINDERGARTEN_CLASSES,
} from "./teacherGradeUtils";

// Teacher segment derivation
export { deriveTeacherSegments } from "./teacherSegmentUtils";

// Assignment to student mapping
export {
    STATUS_LABELS,
    STATUS_PRIORITY,
    mapAssignmentsToStudents,
    mergeRosterWithAssignments,
    isUpdateDue,
    buildChartSeries,
    buildHistory,
} from "./teacherMappingUtils";

// Common utilities
export {
    STAT_TEMPLATE,
    formatDate,
    slugify,
    getStoredUser,
    buildStatCards,
} from "./teacherCommonUtils";
