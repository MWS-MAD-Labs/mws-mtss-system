import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { formatMentorDisplay, formatMentorRoster } from "../utils/mentorNameUtils";
import "@/pages/styles/student-ios-system.css";

const resolveMentorDisplay = (student = {}) => {
    const mentorRoster = formatMentorRoster(student.profile?.mentors || []);
    if (mentorRoster.length) {
        return mentorRoster.join(", ");
    }
    if (Array.isArray(student.teachers) && student.teachers.length) {
        const formattedTeachers = formatMentorRoster(student.teachers);
        if (formattedTeachers.length) {
            return formattedTeachers.join(", ");
        }
    }
    return formatMentorDisplay({
        name: student.mentor || student.profile?.mentor,
        nickname: student.mentorNickname || student.profile?.mentorNickname,
        username: student.mentorUsername || student.profile?.mentorUsername,
        gender: student.mentorGender || student.profile?.mentorGender,
    });
};

const resolveFocusDisplay = (student = {}) => {
    return (
        student.focus
        || student.primaryIntervention?.label
        || student.type
        || student.profile?.type
        || "Tiered Supports"
    );
};

const resolveGradeLabel = (student = {}) => {
    return student.gradeTierLabel || `${student.grade || student.currentGrade || "-"} - ${student.tier || "Tier 1"}`;
};

const StudentSelectionView = ({ students, onSelect, onBack, isLoading = false, error = null, onRetry }) => (
    <div className="mtss-theme student-shell min-h-screen relative overflow-hidden" data-student-theme="portal">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(251,191,36,0.36),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(244,114,182,0.3),transparent_38%),radial-gradient(circle_at_72%_80%,rgba(59,130,246,0.26),transparent_46%),linear-gradient(140deg,#fff7ed_0%,#fdf2f8_42%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_12%_18%,rgba(251,191,36,0.12),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(244,114,182,0.12),transparent_38%),radial-gradient(circle_at_72%_80%,rgba(59,130,246,0.12),transparent_46%),linear-gradient(140deg,#1f1b2e_0%,#1e2134_42%,#1a2238_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-[size:52px_52px] opacity-25 dark:opacity-18" />
        </div>

        <div className="relative z-10 container-tight pb-28 pt-12 text-slate-800 dark:text-white space-y-9">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                <p className="ios-pill inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-6 py-2 text-xs font-black tracking-[0.34em] text-rose-500 shadow-lg dark:border-white/15 dark:bg-white/10 dark:text-rose-200">
                    MTSS Student Portal
                </p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight">
                    <span className="bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">Choose Your Journey</span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium">
                    Pick a student profile to see colorful MTSS progress, schedule, and mentor updates.
                </p>
            </motion.div>

            {isLoading && (
                <div className="ios-glass rounded-[34px] border border-white/70 bg-white/82 p-8 text-center space-y-3 shadow-md dark:border-white/15 dark:bg-white/10">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-rose-500" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading MTSS students...</p>
                </div>
            )}

            {!isLoading && error && (
                <div className="ios-glass-soft rounded-[34px] bg-rose-50/95 dark:bg-rose-500/10 border border-rose-200/70 p-6 text-center space-y-3 shadow-sm">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Could not load students.</p>
                    <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
                    <button
                        onClick={onRetry}
                        className="ios-pill inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-white/10 border border-white/60 dark:border-white/20 text-sm font-semibold"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            )}

            {!isLoading && !error && students.length === 0 && (
                <div className="ios-glass rounded-[34px] border border-white/70 bg-white/85 p-8 text-center shadow-sm dark:border-white/15 dark:bg-white/5">
                    <p className="text-lg font-bold">No MTSS student data found for this account.</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Ask your MTSS admin to verify class assignments and student roster scope.</p>
                </div>
            )}

            {!isLoading && !error && students.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                    {students.map((student) => (
                        <motion.button
                            key={student.id}
                            whileHover={{ scale: 1.02, y: -6 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(student.id)}
                            className="group ios-lift relative overflow-hidden rounded-[42px] border border-white/70 text-left shadow-[0_22px_56px_rgba(15,23,42,0.2)]"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${student.accent}`} />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/15 mix-blend-overlay" />
                            <div className="relative z-10 p-8 text-white space-y-3">
                                <p className="text-xs uppercase tracking-[0.4em] opacity-90">Student Profile</p>
                                <h2 className="text-3xl font-black drop-shadow-md">{student.name}</h2>
                                <p className="text-base font-semibold">{resolveGradeLabel(student)}</p>
                                <div className="rounded-3xl bg-white/22 px-4 py-2 text-sm font-semibold">
                                    <p>Focus: {resolveFocusDisplay(student)}</p>
                                    <p>Mentor: {resolveMentorDisplay(student)}</p>
                                </div>
                                <span className="inline-flex items-center gap-2 text-sm uppercase font-black tracking-[0.4em]">
                                    Enter Portal
                                    <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                                        -&gt;
                                    </motion.span>
                                </span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            <div className="flex justify-center">
                <button
                    onClick={onBack}
                    className="ios-pill px-6 py-3 rounded-full bg-white/85 dark:bg-white/10 text-sm font-semibold text-rose-500 shadow-lg border border-white/60 hover:shadow-xl transition"
                >
                    &lt;- Back to Role Selection
                </button>
            </div>
        </div>
    </div>
);

StudentSelectionView.displayName = "StudentSelectionView";
export default memo(StudentSelectionView);
