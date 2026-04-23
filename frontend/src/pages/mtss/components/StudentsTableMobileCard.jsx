import { memo } from "react";
import { TrendingUp, FilePenLine, Calendar, User } from "lucide-react";
import { ensureStudentInterventions } from "../utils/interventionUtils";
import { resolveProgressAssignmentForStudent } from "../utils/editPlanAccess";
import { getStudentLastUpdateDisplay, getStudentNextUpdateDisplay } from "../utils/studentUpdateUtils";
import InterventionChips, { getAccentColor, getMaxTierCode } from "./InterventionChips";
import StudentUpdateValue from "./StudentUpdateValue";

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
        const interventions = ensureStudentInterventions(student.interventions);
        const maxTier = getMaxTierCode(interventions);
        const mentorLabel = student.mentor || student.profile?.mentor || "";

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
                label: "Update",
                onClick: (e) => { e.stopPropagation(); onUpdate?.(student); },
                icon: TrendingUp,
                className: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/40",
            });
        }
        if (canEditPlan) {
            actionButtons.push({
                key: "edit",
                label: "Edit Plan",
                onClick: (e) => { e.stopPropagation(); onEditPlan?.(student); },
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
                onClick={() => onView?.(student)}
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
                            </div>
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

                    {/* ── Section 2: Interventions (scroll strip) + Progress ─ */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex-1 min-w-0">
                            <InterventionChips interventions={interventions} compact />
                        </div>
                        <div className="shrink-0">
                            <ProgressBadge status={student.progress} compact />
                        </div>
                    </div>

                    {/* ── Section 3: Footer (date + actions) ────────── */}
                    <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800/50">
                        <div className="grid grid-cols-2 gap-3 mb-1.5">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 shrink-0" />
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
                                    <Calendar className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 shrink-0" />
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
