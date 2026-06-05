import { memo, useMemo, useState } from "react";
import { ChevronDown, FilePenLine, TrendingUp } from "lucide-react";
import { ensureStudentInterventions } from "../utils/interventionUtils";
import { resolveProgressAssignmentForStudent } from "../utils/editPlanAccess";
import { getStudentLastUpdateDisplay, getStudentNextUpdateDisplay } from "../utils/studentUpdateUtils";
import InterventionChips, { getAccentColor } from "./InterventionChips";
import StudentUpdateValue from "./StudentUpdateValue";

const getSupportRowKey = (unit = {}, index = 0) =>
    unit.id || unit._id || unit.supportUnit?.assignmentId || `${unit.name || "unit"}-${index}`;

const getSupportSubjectLabel = (unit = {}) =>
    unit.supportUnit?.subject || unit.profile?.type || unit.type || "Focused Support";

const getSupportOwnerLabel = (unit = {}) =>
    unit.supportUnit?.owner || unit.studentSubjectMentorPair?.mentorName || unit.profile?.studentSubjectMentorPair?.mentorName || unit.mentor || unit.profile?.mentor || "-";

const getSupportPairingLabel = (unit = {}) =>
    unit.supportUnit?.pairingLabel || unit.pairingLabel || unit.profile?.pairingLabel || [
        unit.name,
        getSupportSubjectLabel(unit),
        getSupportOwnerLabel(unit),
    ].filter(Boolean).join(" - ");

const getGroupedProgressLabel = (rows = []) => {
    const statuses = rows.map((unit) => unit.progress).filter(Boolean);
    const unique = Array.from(new Set(statuses));
    if (!unique.length) return "No Status";
    if (unique.length === 1) return unique[0];
    const onTrackCount = statuses.filter((status) => status === "On Track" || status === "Completed").length;
    return `${onTrackCount}/${rows.length} On Track`;
};

const getLatestDateLabel = (rows = [], resolver) => {
    const displays = rows.map(resolver).filter((display) => display?.dateLabel);
    return displays[0] || { dateLabel: null, subjectLabel: `${rows.length} subjects` };
};

const getSubjectSummary = (rows = []) => rows.map(getSupportSubjectLabel).filter(Boolean);

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
        const [expanded, setExpanded] = useState(false);
        const supportRows = useMemo(
            () => (Array.isArray(student.supportUnitRows) && student.supportUnitRows.length
                ? student.supportUnitRows
                : [student]),
            [student],
        );
        const isGrouped = supportRows.length > 1;
        const primaryStudent = supportRows[0] || student;
        const actionStudent = isGrouped ? student : primaryStudent;
        const interventions = ensureStudentInterventions(student.interventions);
        const classLabel = student.className || "\u2014";
        const mentorLabel = getSupportOwnerLabel(primaryStudent);
        const supportSubjectLabel = isGrouped
            ? `${supportRows.length} support units`
            : student.supportUnit?.subject || student.profile?.type || student.type || "";
        const groupedProgressLabel = useMemo(() => getGroupedProgressLabel(supportRows), [supportRows]);
        const groupedLastUpdate = useMemo(
            () => getLatestDateLabel(supportRows, getStudentLastUpdateDisplay),
            [supportRows],
        );
        const groupedNextUpdate = useMemo(
            () => getLatestDateLabel(supportRows, getStudentNextUpdateDisplay),
            [supportRows],
        );
        const subjectSummary = useMemo(() => getSubjectSummary(supportRows), [supportRows]);
        const pairingLabel = useMemo(() => getSupportPairingLabel(primaryStudent), [primaryStudent]);

        /* ── Assignment & action logic ─────────────────────────── */
        const assignmentOptions = Array.isArray(student.assignmentOptions) ? student.assignmentOptions : [];
        const primaryAssignment = assignmentOptions[0] || null;
        const editableAssignment = useMemo(() => {
            if (!assignmentOptions.length) return primaryAssignment;
            if (typeof canEditPlanForStudent !== "function") return primaryAssignment;
            return assignmentOptions.find((option) => (
                option?.assignmentId && canEditPlanForStudent(actionStudent, option)
            )) || primaryAssignment;
        }, [actionStudent, assignmentOptions, canEditPlanForStudent, primaryAssignment]);
        const hasInterventionPlan = Boolean(
            assignmentOptions.some((option) => option?.assignmentId) ||
            student.assignmentId ||
            Number(student.activeAssignmentCount || 0) > 0 ||
            Number(student.assignmentCount || 0) > 0,
        );
        const lastUpdateDisplay = getStudentLastUpdateDisplay(primaryStudent);
        const nextUpdateDisplay = getStudentNextUpdateDisplay(primaryStudent);
        const canEditPlan = hasInterventionPlan && Boolean(onEditPlan) && (
            typeof canEditPlanForStudent === "function"
                ? Boolean(editableAssignment?.assignmentId && canEditPlanForStudent(actionStudent, editableAssignment))
                : Boolean(editableAssignment?.assignmentId || student.assignmentId)
        );
        const progressAssignment = resolveProgressAssignmentForStudent(actionStudent);
        const canSubmitProgress = Boolean(progressAssignment?.assignmentId);

        const actionButtons = [];
        if (canSubmitProgress) {
            actionButtons.push({
                key: "progress",
                label: "Progress Update",
                shortLabel: "Update",
                onClick: (e) => { e.stopPropagation(); onUpdate?.(actionStudent); },
                icon: TrendingUp,
                className: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-700/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20",
            });
        }
        if (canEditPlan) {
            actionButtons.push({
                key: "edit",
                label: "Edit Plan",
                onClick: (e) => {
                    e.stopPropagation();
                    onEditPlan?.({ student: actionStudent, assignmentOption: editableAssignment });
                },
                icon: FilePenLine,
                className: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-700/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:shadow-cyan-200/30 dark:hover:shadow-cyan-900/20",
            });
        }

        /* Accent bar: tier-based for escalated, decorative for universal */
        const accentColor = getAccentColor(interventions, index);

        return (
            <>
            <tr
                onClick={() => onView?.(primaryStudent)}
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
                <td className="py-3.5 pl-3 pr-2 align-top w-[16%]">
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
                        {supportSubjectLabel && (
                            <span
                                className="mt-1 inline-flex max-w-[200px] items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-200"
                                title={`Support unit: ${supportSubjectLabel}`}
                            >
                                {supportSubjectLabel}
                            </span>
                        )}
                    </div>
                </td>

                {/* Class / Mentor */}
                <td className="py-3.5 pr-2 align-top w-[13%]">
                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={classLabel}>
                        {classLabel}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 truncate" title={`Mentor: ${mentorLabel}`}>
                        {mentorLabel}
                    </span>
                    {!isGrouped && pairingLabel && (
                        <span className="mt-1 block truncate text-[10px] font-semibold text-sky-600 dark:text-sky-200" title={pairingLabel}>
                            {pairingLabel}
                        </span>
                    )}
                </td>

                {/* Interventions — top 2 inline, rest collapsed */}
                <td className="py-3.5 pr-2 align-top w-[22%]">
                    {isGrouped ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{supportRows.length} subjects</p>
                                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-white/55" title={subjectSummary.join(", ")}>
                                        {subjectSummary.join(", ")}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setExpanded((value) => !value);
                                    }}
                                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                                    aria-expanded={expanded}
                                >
                                    Details
                                    <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <InterventionChips interventions={interventions} />
                    )}
                </td>

                {/* Progress */}
                <td className="py-3.5 pr-2 align-top w-[9%]">
                    {isGrouped ? (
                        <ProgressBadge status={groupedProgressLabel} />
                    ) : (
                        <ProgressBadge status={student.progress} />
                    )}
                </td>

                {/* Last Update */}
                <td className="py-3.5 pr-2 align-top w-[13%]">
                    {isGrouped ? (
                        <StudentUpdateValue
                            dateLabel={groupedLastUpdate.dateLabel}
                            subjectLabel={`${supportRows.length} subjects`}
                            emptyLabel="No updates yet"
                        />
                    ) : (
                        <StudentUpdateValue
                            dateLabel={lastUpdateDisplay.dateLabel}
                            subjectLabel={lastUpdateDisplay.subjectLabel}
                            emptyLabel="No updates yet"
                        />
                    )}
                </td>

                {/* Next Update */}
                <td className="py-3.5 pr-2 align-top w-[12%]">
                    {isGrouped ? (
                        <StudentUpdateValue
                            dateLabel={groupedNextUpdate.dateLabel}
                            subjectLabel={`${supportRows.length} subjects`}
                            emptyLabel="Not scheduled"
                        />
                    ) : (
                        <StudentUpdateValue
                            dateLabel={nextUpdateDisplay.dateLabel}
                            subjectLabel={nextUpdateDisplay.subjectLabel}
                            emptyLabel="Not scheduled"
                        />
                    )}
                </td>

                {/* Actions */}
                {showActions && (
                        <td className="py-3.5 pr-8 align-middle w-[14%]">
                            <div className="flex flex-nowrap items-center justify-center gap-1.5">
                                {actionButtons.map((action) => {
                                    const Icon = action.icon;
                                    const hinted = showPilotHint && pilotHintAction === action.key;
                                    return (
                                        <div key={action.key} className="relative">
                                            {hinted && (
                                                <span className="pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                                                    Click Edit Plan
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={action.onClick}
                                                title={action.label}
                                                aria-label={action.label}
                                                className={`relative inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 ${action.className} ${
                                                    hinted ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-slate-900 animate-pulse" : ""
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                <span className="hidden xl:inline">{action.shortLabel ?? action.label}</span>
                                            </button>
                                        </div>
                                    );
                            })}
                        </div>
                    </td>
                )}
            </tr>
            {isGrouped && expanded && (
                <tr className="border-b border-slate-100/80 bg-slate-50/60 dark:border-slate-700/40 dark:bg-white/[0.03]">
                    <td className="w-1.5 py-0" />
                    {selectable && <td />}
                    <td colSpan={showActions ? 7 : 6} className="px-4 pb-4 pt-1">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                            <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:border-white/10 dark:text-white/40">
                                <span>Subject</span>
                                <span>Intervention</span>
                                <span>Progress</span>
                                <span>Last</span>
                                <span>Next</span>
                            </div>
                            {supportRows.map((unit, unitIndex) => {
                                const lastDisplay = getStudentLastUpdateDisplay(unit);
                                const nextDisplay = getStudentNextUpdateDisplay(unit);
                                const subject = getSupportSubjectLabel(unit);
                                const unitPairing = getSupportPairingLabel(unit);
                                return (
                                    <div
                                        key={getSupportRowKey(unit, unitIndex)}
                                        className="grid grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr_0.8fr] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-white/10"
                                    >
                                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white" title={unitPairing}>
                                            {subject}
                                        </p>
                                        <InterventionChips interventions={ensureStudentInterventions(unit.interventions)} compact />
                                        <ProgressBadge status={unit.progress} compact />
                                        <StudentUpdateValue
                                            dateLabel={lastDisplay.dateLabel}
                                            emptyLabel="No updates"
                                            compact
                                        />
                                        <StudentUpdateValue
                                            dateLabel={nextDisplay.dateLabel}
                                            emptyLabel="Not scheduled"
                                            compact
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </td>
                </tr>
            )}
            </>
        );
    },
);

StudentsTableDesktopRow.displayName = "StudentsTableDesktopRow";
export default StudentsTableDesktopRow;
