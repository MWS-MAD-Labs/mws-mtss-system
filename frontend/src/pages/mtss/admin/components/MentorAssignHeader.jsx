import { memo } from "react";
import { Sparkles } from "lucide-react";

const MentorAssignHeader = memo(({
    mentor,
    tier,
    tierOptions,
    focusInput,
    selectedCount,
    mentorSegments
}) => (
    <div className="relative space-y-4" data-aos="fade-up" data-aos-delay="200">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#c7d2fe] via-[#fbcfe8] to-[#fecdd3] text-xs font-semibold text-slate-700 dark:text-white shadow-inner">
            <Sparkles className="w-4 h-4 text-rose-500" />
            Assign Students
        </div>
        <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-3xl bg-white/80 text-slate-900 font-black flex items-center justify-center shadow-inner shadow-white/40">
                    {mentor?.name
                        ?.split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("") || "??"}
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">{mentor?.name || "Mentor"}</h1>
                    <p className="text-sm font-semibold text-slate-600 dark:text-white/70">{mentor?.jobPosition || mentor?.role || "Teacher"}</p>
                </div>
            </div>
            <div className="ml-auto text-right text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">
                <p>Tier focus</p>
                <p className="text-base font-black tracking-normal text-slate-900 dark:text-white">
                    {tierOptions.find((option) => option.value === tier)?.label}
                </p>
            </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-white/70 max-w-2xl">
            Select at least two students to keep the small-group energy collaborative. Focus areas and notes stay optional so the flow remains light but intentional.
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-white/60">
            Caseload scope: {mentorSegments.allowedGrades.length ? mentorSegments.allowedGrades.join(", ") : mentor?.unit || "All Grades"}
        </p>
        <div className="grid gap-3 sm:grid-cols-3" data-aos="fade-up" data-aos-delay="240">
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/10 px-4 py-3 shadow-inner">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">Selected</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedCount}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-[#e0f2fe] via-[#ecfeff] to-[#fef3c7] dark:from-[#0d2538] dark:via-[#13213c] dark:to-[#2a1a3f] border border-white/60 dark:border-white/10 px-4 py-3 shadow-inner">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">Tier</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                    {tierOptions.find((option) => option.value === tier)?.label}
                </p>
            </div>
            <div className="rounded-2xl bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 px-4 py-3 shadow-inner">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">Focus Area</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white line-clamp-1">
                    {focusInput || "Fluency boost, SEL routines"}
                </p>
            </div>
        </div>
    </div>
));

MentorAssignHeader.displayName = "MentorAssignHeader";
export default MentorAssignHeader;
