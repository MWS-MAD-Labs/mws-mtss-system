import { useMemo, useState } from "react";
import { ChevronDown, History, Rocket, Settings2, TrendingUp } from "lucide-react";
import EvidenceViewer from "./EvidenceViewer";
import { buildInterventionActivityEntries } from "../utils/interventionActivityLog";

const EVENT_META = {
    started: {
        label: "Start",
        icon: Rocket,
        chip: "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300",
        dot: "bg-sky-500",
    },
    plan: {
        label: "Plan",
        icon: Settings2,
        chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
        dot: "bg-amber-500",
    },
    progress: {
        label: "Progress",
        icon: TrendingUp,
        chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
        dot: "bg-emerald-500",
    },
};

const SIGNAL_META = {
    emerging: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
    developing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
    consistent: "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-300",
};

const TAG_LABELS = {
    emotional_regulation: "Emotional Regulation",
    language: "Language",
    social: "Social",
    motor: "Motor Skills",
    independence: "Independence",
};

const InterventionActivityLog = ({
    intervention,
    title = "Update Log",
    className = "",
    defaultOpen = false,
    emptyTitle = "No activity yet",
    emptyMessage = "Timeline entries will appear after the first intervention update is recorded.",
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const entries = useMemo(() => buildInterventionActivityEntries(intervention), [intervention]);

    return (
        <div className={`rounded-2xl border border-white/60 dark:border-slate-700/40 overflow-hidden bg-white/85 dark:bg-slate-900/50 ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors duration-150 active:bg-slate-100/60 dark:active:bg-slate-800/40 sm:px-4 sm:py-3"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm sm:h-8 sm:w-8">
                    <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-foreground sm:text-sm">{title}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground/70 sm:text-xs">{entries.length}</span>
                </div>
                <ChevronDown
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-transform duration-300"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                />
            </button>

            <div
                className="grid transition-[grid-template-rows] duration-300"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
                <div className="overflow-hidden">
                    <div className="max-h-[28rem] space-y-2 overflow-y-auto px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                        <div className="mb-2 h-px bg-slate-200/60 dark:bg-slate-700/40" />

                        {entries.length > 0 ? (
                            entries.map((entry, index) => {
                                const meta = EVENT_META[entry.type] || EVENT_META.progress;
                                const EventIcon = meta.icon;

                                return (
                                    <div key={entry.id || `${entry.type}-${index}`} className="flex items-start gap-3 rounded-2xl bg-slate-50/80 px-3 py-3 dark:bg-slate-950/35">
                                        <div className="flex flex-col items-center pt-1">
                                            <div className={`h-2.5 w-2.5 rounded-full ${meta.dot} shadow-[0_0_0_2px_rgba(255,255,255,0.95)] dark:shadow-[0_0_0_2px_rgba(15,23,42,0.95)]`} />
                                            {index < entries.length - 1 && (
                                                <div className="mt-1 min-h-[20px] w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${meta.chip}`}>
                                                        <EventIcon className="h-3 w-3" />
                                                        {meta.label}
                                                    </span>
                                                    {entry.occurredLabel && (
                                                        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
                                                            {entry.occurredLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.scoreLabel && (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 sm:text-[11px]">
                                                        {entry.scoreLabel}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-foreground dark:text-white">{entry.title}</p>
                                                {entry.actor && (
                                                    <p className="text-xs text-muted-foreground">By {entry.actor}</p>
                                                )}
                                                {entry.observation && (
                                                    <p className="text-sm text-foreground dark:text-white leading-relaxed">{entry.observation}</p>
                                                )}
                                            </div>

                                            {Array.isArray(entry.details) && entry.details.length > 0 && (
                                                <div className="space-y-1">
                                                    {entry.details.map((detail, detailIndex) => (
                                                        <p key={`${entry.id || index}-detail-${detailIndex}`} className="text-xs text-slate-600 dark:text-slate-300">
                                                            {detail}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2">
                                                {entry.signal && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${SIGNAL_META[entry.signal] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                                                        {entry.signal}
                                                    </span>
                                                )}
                                                {entry.celebration && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/35 dark:text-amber-300">
                                                        {entry.celebration}
                                                    </span>
                                                )}
                                                {Array.isArray(entry.tags) && entry.tags.length > 0 && entry.tags.map((tag) => (
                                                    <span key={`${entry.id || index}-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                        {TAG_LABELS[tag] || tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {Array.isArray(entry.evidence) && entry.evidence.length > 0 && (
                                                <EvidenceViewer evidence={entry.evidence} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center dark:border-slate-700">
                                <p className="text-sm font-semibold text-foreground dark:text-white">{emptyTitle}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterventionActivityLog;
