import { memo } from "react";
import { TrendingUp, FilePenLine } from "lucide-react";
import { ensureStudentInterventions } from "../utils/interventionUtils";
import { resolveProgressAssignmentForStudent } from "../utils/editPlanAccess";
import { getStudentLastUpdateDisplay, getStudentNextUpdateDisplay } from "../utils/studentUpdateUtils";
import InterventionChips, { getAccentColor } from "./InterventionChips";
import StudentUpdateValue from "./StudentUpdateValue";

const StudentsTableDesktopRow = memo(
    ({
        index,
        student,
        ProgressBadge,
        showActions,
        pilotHintAction,
        showPilotHint = false,
        onView,
        onUpdate,
        onEditPlan,
        canEditPlanForStudent,
        selectable,
        selected,
        onSelect,
    }) => {
        const interventions = ensureStudentInterventions(student.interventions);
        const classLabel = student.className || "\u2014";
        const mentorLabel = student.mentor || student.profile?.mentor || "-";

        /* ── Assignment & action logic ─────────────────────────── */
        const assignmentOptions = Array.isArray(student.assignmentOptions) ? student.assignmentOptions : [];
        const primaryAssignment = assignmentOptions[0] || null;
        const hasInterventionPlan = Boolean(
            assignmentOptions.some((option) => option?.assignmentId) ||
            student.assignmentId ||
            Number(student.activeAssignmentCount || 0) > 0 ||
            Number(student.assignmentCount || 0) > 0,
        );
        const lastUpdateDisplay = getStudentLastUpdateDisplay(student);
        const nextUpdateDisplay = getStudentNextUpdateDisplay(student);
        const canEditPlan = hasInterventionPlan && Boolean(onEditPlan) && (
            typeof canEditPlanForStudent === "function"
                ? canEditPlanForStudent(student)
                : Boolean(primaryAssignment?.assignmentId || student.assignmentId)
        );
        const progressAssignment = resolveProgressAssignmentForStudent(student);
        const canSubmitProgress = Boolean(progressAssignment?.assignmentId);

        const actionButtons = [];
        if (canSubmitProgress) {
            actionButtons.push({
                key: "progress",
                label: "Progress Update",
                onClick: (e) => { e.stopPropagation(); onUpdate?.(student); },
                icon: TrendingUp,
                className: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-700/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20",
            });
        }
        if (canEditPlan) {
            actionButtons.push({
                key: "edit",
                label: "Edit Plan",
                onClick: (e) => { e.stopPropagation(); onEditPlan?.(student); },
                icon: FilePenLine,
                className: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-700/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:shadow-cyan-200/30 dark:hover:shadow-cyan-900/20",
            });
        }

        /* Accent bar: tier-based for escalated, decorative for universal */
        const accentColor = getAccentColor(interventions, index);

        return (
            <tr
                onClick={() => onView?.(student)}
                className={`group border-b border-slate-100/80 dark:border-slate-700/40 last:border-none hover:bg-gradient-to-r hover:from-indigo-50/50 hover:via-purple-50/30 hover:to-transparent dark:hover:from-white/[0.04] dark:hover:via-white/[0.02] dark:hover:to-transparent transition-colors duration-200 cursor-pointer ${
                    showPilotHint && pilotHintAction === "view" ? "bg-amber-50/70 dark:bg-amber-500/10" : ""
                }`}
            >
                {/* Accent bar — color reflects highest tier */}
                <td className="w-1.5 py-0">
                    <div className={`w-1 h-8 my-auto rounded-full bg-gradient-to-b ${accentColor} opacity-60 group-hover:opacity-100 group-hover:h-10 transition-all duration-200`} />
                </td>

                {selectable && (
                    <td className="py-3.5 pl-2 align-top" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-400 transition"
                            checked={selected}
                            onChange={() => onSelect?.(student)}
                        />
                    </td>
                )}

                {/* Student name */}
                <td className="py-3.5 pl-3 pr-2 align-top w-[18%]">
                    <div>
                        {showPilotHint && pilotHintAction === "view" && (
                            <span className="mb-1 inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                                Click this row
                            </span>
                        )}
                        <span
                            className="block truncate max-w-[200px] font-semibold text-sm text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                            title={student.name}
                        >
                            {student.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{student.grade}</span>
                    </div>
                </td>

                {/* Class / Mentor */}
                <td className="py-3.5 pr-2 align-top w-[14%]">
                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={classLabel}>
                        {classLabel}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 truncate" title={`Mentor: ${mentorLabel}`}>
                        {mentorLabel}
                    </span>
                </td>

                {/* Interventions — top 2 inline, rest collapsed */}
                <td className="py-3.5 pr-2 align-top w-[23%]">
                    <InterventionChips interventions={interventions} />
                </td>

                {/* Progress */}
                <td className="py-3.5 pr-2 align-top w-[10%]">
                    <ProgressBadge status={student.progress} />
                </td>

                {/* Last Update */}
                <td className="py-3.5 pr-2 align-top w-[15%]">
                    <StudentUpdateValue
                        dateLabel={lastUpdateDisplay.dateLabel}
                        subjectLabel={lastUpdateDisplay.subjectLabel}
                        emptyLabel="No updates yet"
                    />
                </td>

                {/* Next Update */}
                <td className="py-3.5 pr-2 align-top w-[14%]">
                    <StudentUpdateValue
                        dateLabel={nextUpdateDisplay.dateLabel}
                        subjectLabel={nextUpdateDisplay.subjectLabel}
                        emptyLabel="Not scheduled"
                    />
                </td>

                {/* Actions */}
                {showActions && (
                    <td className="py-3.5 pr-4 align-middle w-[10%]">
                        <div className="flex items-center justify-center gap-1.5">
                            {actionButtons.map((action) => {
                                const Icon = action.icon;
                                const hinted = showPilotHint && pilotHintAction === action.key;
                                return (
                                    <div key={action.key} className="relative">
                                        {hinted && (
                                            <span className="pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                                                Click this icon
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={action.onClick}
                                            title={action.label}
                                            aria-label={action.label}
                                            className={`relative w-7 h-7 inline-flex items-center justify-center rounded-lg border hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 ${action.className} ${
                                                hinted ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-slate-900 animate-pulse" : ""
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </td>
                )}
            </tr>
        );
    },
);

StudentsTableDesktopRow.displayName = "StudentsTableDesktopRow";
export default StudentsTableDesktopRow;
