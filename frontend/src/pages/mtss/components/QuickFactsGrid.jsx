import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, CalendarDays, Award } from "lucide-react";
import { glassStyles } from "../config/studentProfileConfig";

const QuickFactsGrid = memo(({ student, profile, mentorLabel }) => {
    const attendanceContext = profile?.attendanceContext || {};
    const quickFacts = [
        { label: "Grade", value: student.grade || "-", icon: BookOpen, gradient: "from-blue-500 to-cyan-500" },
        { label: "Class", value: student.className || "-", icon: Users, gradient: "from-emerald-500 to-teal-500" },
        { label: "Started", value: profile?.started || "-", icon: CalendarDays, gradient: "from-rose-500 to-pink-500" },
        { label: "Mentor", value: mentorLabel, icon: Award, gradient: "from-purple-500 to-violet-500" },
    ];
    const attendanceFacts = [
        { label: "Attendance Rate", value: attendanceContext.rate || "Not recorded", icon: CalendarDays, gradient: "from-indigo-500 to-violet-500" },
        { label: "Missed MTSS Sessions", value: attendanceContext.missedMtssSessions ?? 0, icon: Users, gradient: "from-amber-500 to-orange-500" },
        {
            label: "Last Absence",
            value: attendanceContext.lastAbsenceSubject
                ? `${attendanceContext.lastAbsenceDate} - ${attendanceContext.lastAbsenceSubject}`
                : attendanceContext.lastAbsenceDate || "No absence logged",
            icon: Award,
            gradient: "from-rose-500 to-pink-500",
        },
    ];

    return (
        <>
            {/* ── Mobile: horizontal compact strip ────────────── */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-slim -mx-1 px-1 pb-1 sm:hidden">
                {quickFacts.map((fact, i) => {
                    const Icon = fact.icon;
                    return (
                        <motion.div
                            key={fact.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + i * 0.04 }}
                            className={`${glassStyles.inner} flex-shrink-0 flex items-center gap-1.5 rounded-xl px-2.5 py-2`}
                        >
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${fact.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <Icon className="w-3 h-3 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[7px] uppercase tracking-wider text-muted-foreground font-semibold leading-tight">
                                    {fact.label}
                                </p>
                                <p className="text-[11px] font-bold text-foreground dark:text-white truncate max-w-[80px] leading-tight">
                                    {fact.value}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Desktop: 4-column grid ─────────────────────── */}
                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3">
                {quickFacts.map((fact, i) => {
                    const Icon = fact.icon;
                    return (
                        <motion.div
                            key={fact.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            className={`${glassStyles.inner} group rounded-2xl p-4 ${glassStyles.hover} hover:-translate-y-0.5 active:scale-[0.99]`}
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${fact.gradient} flex items-center justify-center mb-2 shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                {fact.label}
                            </p>
                            <p className="text-base font-bold text-foreground dark:text-white truncate">
                                {fact.value}
                            </p>
                        </motion.div>
                    );
                })}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                    {attendanceFacts.map((fact, i) => {
                        const Icon = fact.icon;
                        return (
                            <motion.div
                                key={fact.label}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.22 + i * 0.04 }}
                                className={`${glassStyles.inner} rounded-2xl p-3 sm:p-4`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${fact.gradient} flex items-center justify-center shadow-sm`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                            {fact.label}
                                        </p>
                                        <p className="text-sm font-bold text-foreground dark:text-white truncate">
                                            {fact.value}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </>
    );
});

QuickFactsGrid.displayName = "QuickFactsGrid";
export default QuickFactsGrid;
