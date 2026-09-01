import { memo } from "react";
import { AlertTriangle } from "lucide-react";

// Surfaces interventions this teacher still owns for a student whose grade
// fell outside their current unit/grade scope - e.g. Central moved them
// from Junior High to SD mid-intervention. useTeacherDashboardData keeps
// these visible instead of silently dropping them; this banner is what
// tells the teacher (or an admin looking over their shoulder) that one
// needs a look, without building a full reassignment workflow for what
// should be a rare event.
const OutOfScopeAssignmentsBanner = ({ assignments = [] }) => {
    if (!assignments.length) return null;

    return (
        <section className="relative overflow-hidden rounded-[28px] border border-amber-300/70 bg-amber-50/80 px-5 py-4 shadow-[0_14px_40px_rgba(217,119,6,0.10)] dark:border-amber-500/30 dark:bg-amber-900/15">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        {assignments.length === 1
                            ? "1 intervention is outside your current grade/unit"
                            : `${assignments.length} interventions are outside your current grade/unit`}
                    </p>
                    <p className="text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/75">
                        You're still the mentor on record, but your unit assignment changed since these were created.
                        Consider reassigning them to a teacher closer to the student now.
                    </p>
                    <ul className="space-y-1 pt-1 text-xs text-amber-800/90 dark:text-amber-200/80">
                        {assignments.map((assignment) => (
                            <li key={assignment.assignmentId || assignment.studentNames.join(",")}>
                                • {assignment.studentNames.join(", ") || "Unnamed student"}
                                {assignment.grade ? ` — ${assignment.grade}` : ""}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

OutOfScopeAssignmentsBanner.displayName = "OutOfScopeAssignmentsBanner";

export default memo(OutOfScopeAssignmentsBanner);
