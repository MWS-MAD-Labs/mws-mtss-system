import { memo } from "react";
import { motion } from "framer-motion";
import { X, FilePenLine } from "lucide-react";
import { lockBodyScroll } from "../utils/bodyScrollLock";
import { useEffect } from "react";

const TIER_STYLES = {
    tier3: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-700/40",
    tier2: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40",
    tier1: "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-700/40",
};

const getTierStyle = (tierCode = "") => {
    const normalized = tierCode?.toLowerCase?.() || "";
    if (normalized.includes("3")) return TIER_STYLES.tier3;
    if (normalized.includes("2")) return TIER_STYLES.tier2;
    return TIER_STYLES.tier1;
};

const getTierLabel = (option = {}) =>
    option.tier || option.tierLabel || (option.tierCode ? `Tier ${option.tierCode.replace(/\D/g, "")}` : "Tier 2");

const getSubjectLabel = (option = {}) =>
    option.focus || option.focusAreas?.[0] || option.label || option.type || "Focused Support";

const getMentorLabel = (option = {}) =>
    option.pairingLabel || option.mentor || option.studentSubjectMentorPair?.mentorName || "";

const SubjectPickerModal = memo(({ student, options = [], onSelect, onClose }) => {
    useEffect(() => {
        if (!student) return undefined;
        return lockBodyScroll();
    }, [student]);

    if (!student) return null;

    return (
        <div className="fixed inset-0 z-[95] mtss-theme">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select subject to edit"
                    className="relative w-full max-w-sm rounded-3xl border border-white/40 bg-white/95 dark:bg-slate-900/90 shadow-[0_20px_60px_rgba(15,23,42,0.3)] overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white px-5 py-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="uppercase text-[10px] tracking-[0.3em] opacity-80">Edit Intervention Plan</p>
                            <h3 className="text-lg font-bold truncate">{student.name}</h3>
                            <p className="text-xs opacity-80">Select which subject to edit</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="shrink-0 p-1.5 bg-white/25 rounded-full hover:bg-white/40 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-2">
                        {options.map((option) => {
                            const subject = getSubjectLabel(option);
                            const mentor = getMentorLabel(option);
                            const tierLabel = getTierLabel(option);
                            const tierStyle = getTierStyle(option.tierCode);
                            return (
                                <button
                                    key={option.assignmentId}
                                    type="button"
                                    onClick={() => onSelect(option)}
                                    className="w-full flex items-center gap-3 rounded-2xl border border-primary/10 bg-white/80 dark:bg-slate-800/60 px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/60 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20 hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 flex items-center justify-center">
                                        <FilePenLine className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground dark:text-white truncate">{subject}</p>
                                        {mentor ? (
                                            <p className="text-[11px] text-muted-foreground truncate">{mentor}</p>
                                        ) : null}
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierStyle}`}>
                                        {tierLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
});

SubjectPickerModal.displayName = "SubjectPickerModal";
export default SubjectPickerModal;
