import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const EmptyStateCard = ({ title, description, icon: Icon }) => (
    <div className="rounded-[24px] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/70 p-5 dark:border-emerald-400/30 dark:from-emerald-500/10 dark:via-white/5 dark:to-sky-500/10">
        <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-200">
                <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-white/70">{description}</p>
            </div>
        </div>
    </div>
);

const OverviewPanelSection = ({ title, icon: Icon, children, accent = "text-primary" }) => (
    <div className="glass glass-card mtss-card-surface rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground dark:text-white">{title}</h3>
            <Icon className={`h-5 w-5 ${accent}`} />
        </div>
        <div className="mt-5">{children}</div>
    </div>
);

const AdminOverviewPanel = ({ statCards, systemSnapshot, subjectStudentBreakdown = [], recentActivity, mentorSpotlights, icons }) => {
    const TierIcon = icons.tier;
    const InterventionIcon = icons.interventions;
    const ActivityIcon = icons.activity;
    const MentorIcon = icons.mentor;
    const hasActiveInterventions = Array.isArray(systemSnapshot.interventions) && systemSnapshot.interventions.length > 0;
    const allTierOne = systemSnapshot.tierBreakdown.every((tier) => tier.label === "Tier 1" || tier.count === 0);

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
                {statCards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br p-6 text-white shadow-[0_25px_80px_rgba(15,23,42,0.22)]"
                    >
                        <div className={`absolute inset-0 opacity-80 bg-gradient-to-br ${card.accent}`} />
                        <span className="mtss-liquid-hover-blob" />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-white/80">
                                <card.icon className="h-5 w-5" />
                                {card.label}
                            </div>
                            <div>
                                <p className="text-4xl font-black tracking-tight">{card.value}</p>
                                <p className="text-sm opacity-80">{card.caption}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <OverviewPanelSection title="Support Units by Tier" icon={TierIcon}>
                    <div className="space-y-4">
                        {systemSnapshot.tierBreakdown.map((tier) => (
                            <div key={tier.label} className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-black text-primary">
                                    {tier.count}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground dark:text-white">{tier.label}</p>
                                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                                    <div className="mt-2 h-2.5 rounded-full bg-white/30 dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-primary/70 via-rose/70 to-gold/70"
                                            style={{ width: systemSnapshot.totalStudents ? `${(tier.count / systemSnapshot.totalStudents) * 100}%` : "0%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </OverviewPanelSection>

                <OverviewPanelSection title="Active Subjects / Focus Areas" icon={InterventionIcon} accent="text-sky-500">
                    {hasActiveInterventions ? (
                        <div className="space-y-4">
                            {systemSnapshot.interventions.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-4 text-sm font-semibold">
                                    <span className="text-foreground dark:text-white">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-32 rounded-full bg-white/20">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-[#7dd3fc] to-[#60a5fa]"
                                                style={{ width: systemSnapshot.activeInterventionCount ? `${(item.count / systemSnapshot.activeInterventionCount) * 100}%` : "0%" }}
                                            />
                                        </div>
                                        <span className="text-muted-foreground dark:text-white/70">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                            {subjectStudentBreakdown.length > 0 && (
                                <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-400/20 dark:bg-sky-500/10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700 dark:text-sky-200">
                                        Student-subject breakdown
                                    </p>
                                    <div className="mt-3 space-y-3">
                                        {subjectStudentBreakdown.slice(0, 4).map((row) => {
                                            const studentPreview = row.students.slice(0, 3).map((student) => student.name).join(", ");
                                            const studentLabel = row.students.length > 3
                                                ? `${studentPreview} +${row.students.length - 3}`
                                                : studentPreview;
                                            return (
                                                <div key={row.subject} className="rounded-xl bg-white/75 px-3 py-2 text-xs dark:bg-slate-800/60">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-black text-slate-900 dark:text-white">{row.subject}</p>
                                                        <span className="font-semibold text-sky-700 dark:text-sky-200">
                                                            {row.supportUnitCount} units
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 truncate text-slate-600 dark:text-white/70" title={studentLabel}>
                                                        {studentLabel || "No students"}
                                                    </p>
                                                    <p className="mt-1 truncate text-[10px] font-semibold text-slate-500 dark:text-white/50" title={row.owners.join(", ")}>
                                                        Owners: {row.owners.slice(0, 2).join(", ") || "Unassigned"}
                                                        {row.owners.length > 2 ? ` +${row.owners.length - 2}` : ""}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyStateCard
                            title={allTierOne ? "No active interventions in this view" : "No intervention plans are currently in scope"}
                            description={
                                allTierOne
                                    ? "Every visible support unit is currently staying in Tier 1 or universal support, so subject / focus area signals should remain empty until a Tier 2 or Tier 3 plan is created."
                                    : "No active intervention assignments were found for this segment yet."
                            }
                            icon={ShieldCheck}
                        />
                    )}
                </OverviewPanelSection>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <OverviewPanelSection title="Recent Activity" icon={ActivityIcon} accent="text-rose-500">
                    {recentActivity.length ? (
                        <div className="space-y-3 text-sm">
                            {recentActivity.map((item) => (
                                <div
                                    key={`${item.date}-${item.student}`}
                                    className="grid grid-cols-[90px_1fr] gap-4 rounded-2xl bg-white/50 p-4 dark:bg-slate-800/50"
                                >
                                    <div>
                                        <p className="font-semibold text-foreground dark:text-white">{item.date}</p>
                                        <p className="text-xs text-muted-foreground">{item.mentor}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground dark:text-white">{item.student}</p>
                                        <p className="text-sm text-muted-foreground dark:text-white/70">{item.activity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyStateCard
                            title="No progress activity has been recorded yet"
                            description="Once teachers submit check-ins or update plans, the newest activity will appear here for a quick admin scan."
                            icon={CheckCircle2}
                        />
                    )}
                </OverviewPanelSection>

                <OverviewPanelSection title="Mentor Spotlight" icon={MentorIcon} accent="text-emerald-500">
                    {mentorSpotlights.length ? (
                        <div className="space-y-4">
                            {mentorSpotlights.map((mentor) => (
                                <div key={mentor.name} className="flex items-center gap-4 rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/70 to-rose/70 font-black text-white">
                                        {mentor.name
                                            .split(" ")
                                            .map((part) => part[0])
                                            .slice(0, 2)
                                            .join("")}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground dark:text-white">{mentor.name}</p>
                                        <p className="text-xs text-muted-foreground">{mentor.focus}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-foreground dark:text-white">{mentor.caseload} support units</p>
                                        <p className="text-xs font-semibold text-emerald-500">{mentor.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyStateCard
                            title="Mentor workload will appear after intervention plans exist"
                            description="Homeroom teachers are still linked to their own class roster, but spotlight cards only appear when a tracked intervention plan is active."
                            icon={MentorIcon}
                        />
                    )}
                </OverviewPanelSection>
            </div>
        </div>
    );
};

AdminOverviewPanel.displayName = "AdminOverviewPanel";
export default memo(AdminOverviewPanel);
