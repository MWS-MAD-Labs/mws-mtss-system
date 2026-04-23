import { BadgeInfo, Sparkles, Users2 } from "lucide-react";

const mentorGuidance = [
    "Homeroom teachers are automatically linked to students in their own class roster.",
    "Manual mentor assignment is only needed for subject-specific support or another special-case owner outside the homeroom teacher.",
    "Use the card metrics to distinguish automatic class-roster ownership from manual exception cases before assigning anyone.",
    "Ask principals to start from the MTSS overview, then navigate to Manage Mentors on their own during testing.",
];

const AdminMentorsHeader = () => (
    <div
        className="mb-8 flex flex-col gap-5"
        data-aos="fade-up"
        data-aos-delay="150"
    >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#e0f2fe] via-[#fef3c7] to-[#fbcfe8] px-4 py-2 text-sm font-semibold text-slate-700 shadow-inner dark:text-white">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    Mentor ownership model
                </div>
                <div className="space-y-2 rounded-[28px] border border-white/60 bg-gradient-to-r from-white/95 via-white/70 to-white/40 p-5 shadow-inner backdrop-blur-xl dark:border-white/10 dark:from-white/10 dark:via-white/5 dark:to-white/5">
                    <h3 className="bg-gradient-to-r from-[#14b8a6] via-[#3b82f6] to-[#a855f7] bg-clip-text text-3xl font-black text-transparent">
                        Manage Mentors
                    </h3>
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-white/70">
                        Review workload, confirm ownership, and only use manual assignment when a student needs support from someone other than the homeroom teacher.
                    </p>
                </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <Users2 className="h-4 w-4" />
                Classroom ownership is automatic
            </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
            {mentorGuidance.map((item) => (
                <div
                    key={item}
                    className="rounded-[24px] border border-white/45 bg-white/80 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5"
                >
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-600 dark:bg-sky-400/15 dark:text-sky-200">
                            <BadgeInfo className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-white/75">{item}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default AdminMentorsHeader;
