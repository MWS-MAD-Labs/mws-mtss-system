import { memo, useMemo, useState } from "react";
import { ChevronDown, FilePenLine, TrendingUp, User } from "lucide-react";
import { ensureStudentInterventions } from "../utils/interventionUtils";
import { resolveProgressAssignmentForStudent } from "../utils/editPlanAccess";
import { getStudentLastUpdateDisplay, getStudentNextUpdateDisplay } from "../utils/studentUpdateUtils";
import InterventionChips, { getAccentColor, getMaxTierCode } from "./InterventionChips";
import StudentUpdateValue from "./StudentUpdateValue";

const getSupportRowKey = (unit = {}, index = 0) =>
    unit.id || unit._id || unit.supportUnit?.assignmentId || `${unit.name || "unit"}-${index}`;

const getSupportSubjectLabel = (unit = {}) =>
    unit.supportUnit?.subject || unit.profile?.type || unit.type || "Focused Support";

const getSupportOwnerLabel = (unit = {}) =>
    unit.supportUnit?.owner || unit.studentSubjectMentorPair?.mentorName || unit.profile?.studentSubjectMentorPair?.mentorName || unit.mentor || unit.profile?.mentor || "";

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

const getFirstDateLabel = (rows = [], resolver) =>
    rows.map(resolver).find((display) => display?.dateLabel) || { dateLabel: null, subjectLabel: null };

const getSubjectSummary = (rows = []) => rows.map(getSupportSubjectLabel).filter(Boolean);

const TIER_CARD_RING = {
    tier3: "ring-1 ring-rose-300/40 dark:ring-rose-600/25",
    tier2: "ring-1 ring-amber-300/40 dark:ring-amber-600/25",
    tier1: "",
};

const StudentsTableMobileCard = memo(
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
        const maxTier = getMaxTierCode(interventions);
        const mentorLabel = getSupportOwnerLabel(primaryStudent);
        const supportSubjectLabel = isGrouped
            ? `${supportRows.length} support units`
            : student.supportUnit?.subject || student.profile?.type || student.type || "";
        const groupedProgressLabel = useMemo(() => getGroupedProgressLabel(supportRows), [supportRows]);
        const groupedLastUpdate = useMemo(
            () => getFirstDateLabel(supportRows, getStudentLastUpdateDisplay),
            [supportRows],
        );
        const groupedNextUpdate = useMemo(
            () => getFirstDateLabel(supportRows, getStudentNextUpdateDisplay),
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
                label: "Update",
                onClick: (e) => { e.stopPropagation(); onUpdate?.(actionStudent); },
                icon: TrendingUp,
                className: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/40",
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
                className: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-700/40",
            });
        }

        const accent = getAccentColor(interventions, index);
        const cardRing = TIER_CARD_RING[maxTier] || "";

        /* Smarter subtitle: avoid "Grade 7 · Grade 7 - Helix" redundancy */
        const classLabel = student.className || "";
        const gradeLabel = student.grade || "";
        const subtitle = classLabel
            ? (classLabel.toLowerCase().includes(gradeLabel.toLowerCase().replace("grade ", ""))
                ? classLabel
                : `${gradeLabel} · ${classLabel}`)
            : gradeLabel;

        return (
            <div
                onClick={() => onView?.(primaryStudent)}
                className={`relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/70 backdrop-blur-lg border border-slate-200/60 dark:border-slate-700/50 shadow-[0_6px_24px_rgba(15,23,42,0.07)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.22)] cursor-pointer active:scale-[0.99] transition-transform duration-100 ${cardRing} ${
                    showPilotHint && pilotHintAction === "view" ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-slate-950" : ""
                }`}
            >
                {showPilotHint && pilotHintAction === "view" && (
                    <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                        Open this card
                    </span>
                )}
                {/* Top accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

                <div className="px-3.5 pt-3 pb-2.5">
                    {/* ── Section 1: Header (name + meta) ───────────── */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex-1 min-w-0">
                            <span className="font-bold text-[14px] leading-tight text-slate-800 dark:text-white block truncate">
                                {student.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                    {subtitle}
                                </span>
                                {mentorLabel && (
                                    <>
                                        <span className="w-px h-2.5 bg-slate-300 dark:bg-slate-600 shrink-0" />
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                            <User className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                            {mentorLabel}
                                        </span>
                                    </>
                                )}
                                {supportSubjectLabel && (
                                    <span
                                        className="inline-flex max-w-[150px] items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-sky-700 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-200"
                                        title={`Support unit: ${supportSubjectLabel}`}
                                    >
                                        {supportSubjectLabel}
                                    </span>
                                )}
                            </div>
                            {!isGrouped && pairingLabel && (
                                <p className="mt-1 truncate text-[10px] font-semibold text-sky-600 dark:text-sky-200" title={pairingLabel}>
                                    {pairingLabel}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                            {selectable && (
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded-md border-slate-300 dark:border-slate-600 text-indigo-500"
                                    checked={selected}
                                    onChange={() => onSelect?.(student)}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── Section 2: Interventions + progress ─ */}
                    {isGrouped ? (
                        <div className="mb-2.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{supportRows.length} subjects</p>
                                    <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-white/55" title={subjectSummary.join(", ")}>
                                        {subjectSummary.join(", ")}
                                    </p>
                                </div>
                                <ProgressBadge status={groupedProgressLabel} compact />
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <StudentUpdateValue
                                    dateLabel={groupedNextUpdate.dateLabel}
                                    subjectLabel={`${supportRows.length} subjects`}
                                    emptyLabel="Not scheduled"
                                    compact
                                />
                                <StudentUpdateValue
                                    dateLabel={groupedLastUpdate.dateLabel}
                                    subjectLabel={`${supportRows.length} subjects`}
                                    emptyLabel="No updates yet"
                                    compact
                                />
                            </div>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setExpanded((value) => !value);
                                }}
                                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                                aria-expanded={expanded}
                            >
                                Details
                                <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                            </button>
                            {expanded && (
                                <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/70 dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/50">
                                    {supportRows.map((unit, unitIndex) => {
                                        const lastDisplay = getStudentLastUpdateDisplay(unit);
                                        const nextDisplay = getStudentNextUpdateDisplay(unit);
                                        const subject = getSupportSubjectLabel(unit);
                                        const owner = getSupportOwnerLabel(unit);
                                        const unitPairing = getSupportPairingLabel(unit);
                                        return (
                                            <div
                                                key={getSupportRowKey(unit, unitIndex)}
                                                className="p-2"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-[11px] font-bold text-slate-800 dark:text-white" title={subject}>
                                                        {subject}
                                                    </p>
                                                    <ProgressBadge status={unit.progress} compact />
                                                </div>
                                                <p className="mt-1 truncate text-[10px] font-semibold text-sky-600 dark:text-sky-200" title={unitPairing}>
                                                    {owner}
                                                </p>
                                                <div className="mt-2 grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2">
                                                    <InterventionChips interventions={ensureStudentInterventions(unit.interventions)} compact />
                                                    <StudentUpdateValue
                                                        dateLabel={nextDisplay.dateLabel}
                                                        emptyLabel="Not scheduled"
                                                        compact
                                                    />
                                                    <StudentUpdateValue
                                                        dateLabel={lastDisplay.dateLabel}
                                                        emptyLabel="No updates"
                                                        compact
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex-1 min-w-0">
                                <InterventionChips interventions={interventions} compact />
                            </div>
                            <div className="shrink-0">
                                <ProgressBadge status={student.progress} compact />
                            </div>
                        </div>
                    )}

                    {/* ── Section 3: Footer (date + actions) ────────── */}
                    <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800/50">
                        {!isGrouped && (
                            <div className="grid grid-cols-2 gap-3 mb-1.5">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        Next Update
                                    </span>
                                </div>
                                <StudentUpdateValue
                                    dateLabel={nextUpdateDisplay.dateLabel}
                                    subjectLabel={nextUpdateDisplay.subjectLabel}
                                    emptyLabel="Not scheduled"
                                    compact
                                />
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        Last Update
                                    </span>
                                </div>
                                <StudentUpdateValue
                                    dateLabel={lastUpdateDisplay.dateLabel}
                                    subjectLabel={lastUpdateDisplay.subjectLabel}
                                    emptyLabel="No updates yet"
                                    compact
                                />
                            </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        {showActions && actionButtons.length > 0 && (
                            <div className="flex gap-2 mt-1.5">
                                {actionButtons.map((action) => {
                                    const Icon = action.icon;
                                    const hinted = showPilotHint && pilotHintAction === action.key;
                                    return (
                                        <button
                                            key={action.key}
                                            type="button"
                                            onClick={action.onClick}
                                            aria-label={action.label}
                                            className={`relative flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-semibold active:scale-95 transition-all ${action.className} ${
                                                hinted ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-slate-950 animate-pulse" : ""
                                            }`}
                                        >
                                            {hinted && (
                                                <span className="pointer-events-none absolute -top-3 right-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                                                    Tap here
                                                </span>
                                            )}
                                            <Icon className="w-3 h-3 shrink-0" />
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    },
);

StudentsTableMobileCard.displayName = "StudentsTableMobileCard";
export default StudentsTableMobileCard;
