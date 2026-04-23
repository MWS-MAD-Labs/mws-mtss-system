import { memo } from "react";
import { motion } from "framer-motion";

const MentorCard = memo(({ mentor, theme, aosVariant, index, batchSize, onAssign, highlightAssign = false }) => {
    const classOwnedStudents = Number(mentor.classOwnedStudents ?? mentor.activeStudents) || 0;
    const interventionStudents = Number(mentor.interventionStudents) || 0;
    const manualAssignedStudents = Number(mentor.manualAssignedStudents ?? interventionStudents) || 0;
    const successValue = Number(String(mentor.successRate ?? "0").replace(/[^\d.]/g, "")) || 0;
    const successTone = successValue >= 85 ? "text-emerald-400" : successValue >= 60 ? "text-amber-400" : "text-rose-400";
    const classTags = Array.isArray(mentor.classes)
        ? mentor.classes.slice(0, 3).map((cls) => {
              const grade = cls.grade || mentor.unit || "MTSS";
              const focus = cls.className || cls.subject;
              return focus ? `${grade} · ${focus}` : grade;
          })
        : [];

    return (
        <motion.div
            key={mentor.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % batchSize) * 0.05 }}
            className={`relative group overflow-hidden rounded-[24px] border border-white/40 dark:border-white/5 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl bg-gradient-to-br ${theme.glass}`}
            data-aos={aosVariant}
            data-aos-delay={200 + (index % batchSize) * 60}
            data-aos-duration={650 + (index % 4) * 120}
        >
            <div className={`absolute -top-14 right-3 w-32 h-32 bg-gradient-to-br ${theme.halo} blur-3xl opacity-60 group-hover:opacity-80 transition`} />
            <div className="absolute inset-0 pointer-events-none opacity-15 group-hover:opacity-30 transition bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" />

            <div className="relative space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/85 text-slate-900 font-black flex items-center justify-center shadow-inner shadow-white/40">
                            {mentor.name
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")}
                        </div>
                        <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{mentor.name}</p>
                            <p className="text-xs font-medium text-slate-600 dark:text-white/70">{mentor.role}</p>
                        </div>
                    </div>
                    <div className="text-right text-[0.55rem] uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
                        <p>{mentor.unit || "Unit"}</p>
                        <p className="text-sm font-black tracking-normal text-slate-900 dark:text-white">
                            {mentor.role || "Teacher"}
                        </p>
                    </div>
                </div>

                {classTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-semibold text-slate-600 dark:text-white/70">
                        {classTags.map((tag) => (
                            <span
                                key={`${mentor.name}-${tag}`}
                                className="px-3 py-1 rounded-full border border-white/60 dark:border-white/20 bg-white/85 dark:bg-white/5"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="grid gap-3 text-xs font-semibold text-slate-600 dark:text-white/70 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/40 dark:border-white/10 px-3 py-3 bg-white/80 dark:bg-white/5 backdrop-blur text-center">
                        <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">Class Roster</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{classOwnedStudents}</p>
                    </div>
                    <div className="rounded-2xl border border-white/40 dark:border-white/10 px-3 py-3 bg-white/80 dark:bg-white/5 backdrop-blur text-center">
                        <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">Manual Cases</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{manualAssignedStudents}</p>
                    </div>
                    <div className="rounded-2xl border border-white/40 dark:border-white/10 px-3 py-3 bg-white/80 dark:bg-white/5 backdrop-blur text-center">
                        <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">Success</p>
                        <p className={`text-2xl font-black ${successTone}`}>{mentor.successRate}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[0.65rem] font-semibold text-slate-600 dark:text-white/70">
                    <span className="px-3 py-1 rounded-full border border-white/60 dark:border-white/20 bg-white/80 dark:bg-white/5">
                        {classOwnedStudents >= 12 ? "High class load" : "Balanced class load"}
                    </span>
                    <span className="px-3 py-1 rounded-full border border-white/60 dark:border-white/20 bg-white/80 dark:bg-white/5">
                        {manualAssignedStudents > 0
                            ? `${manualAssignedStudents} special-case handoff${manualAssignedStudents === 1 ? "" : "s"}`
                            : "No special-case handoffs"}
                    </span>
                    <span className="px-3 py-1 rounded-full border border-white/60 dark:border-white/20 bg-white/80 dark:bg-white/5">
                        {interventionStudents > 0
                            ? `${interventionStudents} intervention student${interventionStudents === 1 ? "" : "s"}`
                            : "Roster ownership only"}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        className={`flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition bg-gradient-to-r ${theme.accent}`}
                    >
                        Pulse profile
                    </button>
                    <button
                        className={`relative flex-1 px-4 py-2.5 rounded-full border border-white/60 dark:border-white/20 text-slate-900 dark:text-white bg-white/85 dark:bg-white/5 shadow-inner hover:-translate-y-0.5 transition ${
                            highlightAssign ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white/80 dark:ring-amber-300 dark:ring-offset-slate-900/80 animate-pulse" : ""
                        }`}
                        onClick={() => onAssign?.(mentor)}
                    >
                        {highlightAssign && (
                            <span className="pointer-events-none absolute -top-2 right-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                                Try this
                            </span>
                        )}
                        Assign
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

MentorCard.displayName = "MentorCard";
export default MentorCard;
