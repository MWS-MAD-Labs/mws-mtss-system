/**
 * ObserverDashboardPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated read-only MTSS executive overview for designated observer accounts
 * (mahrukh@millennia21.id, faisal@millennia21.id).
 *
 * Sees ALL units — Kindergarten → Junior High — in view-only mode.
 * Cannot create, edit, or submit any intervention data.
 *
 * Animations
 *   · GSAP  — page entrance, hero reveal, animated stat counters
 *   · anime.js — tab indicator stagger, card entrance, tier bar fills
 *
 * Performance
 *   · Single backdrop-filter per glass layer (no nesting)
 *   · will-change only while animating (cleared after)
 *   · Admin panels lazy-loaded; below-fold rendered in Suspense
 *   · requestIdleCallback for non-critical init
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { memo, Suspense, lazy, useMemo, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { animate, stagger } from "animejs";
import {
    Eye, Users2, TrendingUp, Sparkles, LayoutDashboard,
    UserCheck, LineChart as LineChartIcon,
    Activity, Brain, ArrowUpRight, Minus,
    ArrowDownRight, AlertCircle, ClipboardCheck,
} from "lucide-react";
import useAdminDashboardData from "./hooks/useAdminDashboardData";
import { useAdminDashboardState } from "./hooks/useAdminDashboardState";
import { overviewIcons } from "./data/adminDashboardContent";

/* ── Lazy panels (reuse admin panels — they're already well-designed) ── */
const AdminOverviewPanel  = lazy(() => import("./admin/AdminOverviewPanel"));
const AdminStudentsPanel  = lazy(() => import("./admin/AdminStudentsPanel"));
const AdminMentorsPanel   = lazy(() => import("./admin/AdminMentorsPanel"));
const AdminAnalyticsPanel = lazy(() => import("./admin/AdminAnalyticsPanel"));

const PanelFallback = () => (
    <div className="glass glass-card p-10 text-center text-muted-foreground animate-pulse rounded-[28px]">
        Loading data…
    </div>
);

/* ── Tabs ─────────────────────────────────────────────────────────── */
const TABS = [
    { key: "overview",  label: "Overview",      icon: LayoutDashboard },
    { key: "students",  label: "All Students",  icon: Users2 },
    { key: "mentors",   label: "Mentors",       icon: UserCheck },
    { key: "analytics", label: "Analytics Lab", icon: LineChartIcon },
];

/* ── Tier pill (compact, dark-on-glass) ───────────────────────────── */
const TierChip = ({ label, count, total }) => {
    const barRef = useRef(null);
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    const styles = {
        "Tier 1": { pill: "bg-emerald-300/18 text-emerald-50 border-emerald-300/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]", bar: "#34d399" },
        "Tier 2": { pill: "bg-amber-300/16 text-amber-50 border-amber-300/34 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]", bar: "#fbbf24" },
        "Tier 3": { pill: "bg-rose-300/16 text-rose-50 border-rose-300/34 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]", bar: "#fb7185" },
    };
    const s = styles[label] || { pill: "bg-white/10 text-white/60 border-white/20", bar: "#94a3b8" };

    useEffect(() => {
        if (!barRef.current) return;
        animate(barRef.current, {
            width: [`0%`, `${pct}%`],
            duration: 900,
            ease: "outExpo",
            delay: 400,
        });
    }, [pct]);

    return (
        <div className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-2xl border backdrop-blur-sm ${s.pill}`}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
                <span className="text-base font-black tabular-nums">{count}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/18 overflow-hidden">
                <div ref={barRef} className="h-full rounded-full" style={{ width: 0, background: s.bar }} />
            </div>
            <span className="text-[9px] font-semibold text-white/78">{pct}% of total</span>
        </div>
    );
};

/* ── Animated stat counter (GSAP tween → DOM textContent) ─────────── */
const StatCounter = memo(({ targetValue, suffix = "", label, icon: Icon, accentClass, delay = 0 }) => {
    const valRef = useRef(null);
    const wrapRef = useRef(null);
    const animated = useRef(false);

    useEffect(() => {
        if (animated.current || targetValue === 0) return;
        animated.current = true;
        const obj = { v: 0 };
        gsap.to(obj, {
            v: targetValue,
            duration: 1.6,
            ease: "power3.out",
            delay: delay / 1000,
            onUpdate: () => {
                if (valRef.current) valRef.current.textContent = Math.round(obj.v) + suffix;
            },
            onComplete: () => {
                if (valRef.current) valRef.current.textContent = targetValue + suffix;
            },
        });
    }, [targetValue, suffix, delay]);

    return (
        <div ref={wrapRef} className="flex flex-col items-center gap-2 text-center px-2">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${accentClass}`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span
                ref={valRef}
                className="text-2xl sm:text-3xl font-black tabular-nums text-white tracking-tight"
            >
                0{suffix}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-white/78 leading-tight text-center">
                {label}
            </span>
        </div>
    );
});
StatCounter.displayName = "StatCounter";

/* ── Tier Movement mini-badge ─────────────────────────────────────── */
const TrendBadge = ({ item }) => {
    const iconMap = {
        "Improved":       { Icon: ArrowUpRight,   cls: "text-emerald-300" },
        "Stable":         { Icon: Minus,           cls: "text-sky-300" },
        "Needs Support":  { Icon: ArrowDownRight,  cls: "text-rose-300" },
    };
    const { Icon, cls } = iconMap[item.label] || { Icon: Minus, cls: "text-white/50" };
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/18 border border-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Icon className={`w-4 h-4 flex-shrink-0 ${cls}`} />
            <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{item.label}</p>
                <p className="text-[10px] text-white/72 truncate">{item.detail}</p>
            </div>
        </div>
    );
};

/* ── Recent activity mini-item ────────────────────────────────────── */
const ActivityItem = ({ item, index }) => (
    <div
        className="flex gap-3 py-2.5 border-b border-slate-200/80 dark:border-white/[0.08] last:border-none"
        data-activity-item
        style={{ opacity: 0 }}
    >
        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-400/25 dark:text-indigo-100 flex items-center justify-center text-[11px] font-bold">
            {index + 1}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.student}</p>
            <p className="text-[10px] text-slate-600 dark:text-white/62 truncate mt-0.5">{item.activity}</p>
        </div>
        <span className="flex-shrink-0 text-[9px] font-medium text-slate-500 dark:text-white/42 whitespace-nowrap pt-0.5">{item.date}</span>
    </div>
);

/* ── Main Page ────────────────────────────────────────────────────── */
const ObserverDashboardPage = memo(() => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const pageRef  = useRef(null);
    const heroRef  = useRef(null);
    const tabRefs  = useRef([]);
    const statsRef = useRef(null);
    const activityRef = useRef(null);

    /* ── Data ─────────────────────────────────────────────────────── */
    const {
        students, statCards, systemSnapshot, recentActivity,
        mentorSpotlights, mentorRoster, mentors,
        successByType, trendData, trendPaths,
        strategyHighlights, tierMovement,
        loading, error, refresh,
    } = useAdminDashboardData();

    const {
        activeTab,
        setActiveTab,
        filters, handleFilterChange,
        filteredStudents, gradeOptions, tierOptions, typeOptions, mentorOptions,
        visibleCount, setVisibleCount,
        handleViewStudent,
    } = useAdminDashboardState(students);

    /* ── Computed values ──────────────────────────────────────────── */
    const totalStudents = systemSnapshot?.totalStudents ?? students.length;
    const totalMentors  = mentorRoster?.length ?? mentors?.length ?? 0;

    const successRate = useMemo(() => {
        if (!statCards?.length) return 0;
        const card = statCards.find(c =>
            c.label?.toLowerCase().includes("success") ||
            c.label?.toLowerCase().includes("rate")
        );
        if (!card) return 0;
        const raw = card.value;
        if (typeof raw === "number") return raw;
        if (typeof raw === "string") return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
        return 0;
    }, [statCards]);

    const tierBreakdown = systemSnapshot?.tierBreakdown ?? [];
    const displayName   = user?.nickname || user?.name?.split(" ")[0] || "Observer";

    /* ── GSAP: page entrance ──────────────────────────────────────── */
    useEffect(() => {
        if (!heroRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                heroRef.current,
                { opacity: 0, y: 28, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: "power3.out", delay: 0.05 }
            );
        }, pageRef.current);
        return () => ctx.revert();
    }, []);

    /* ── anime.js: activity feed entrance ────────────────────────── */
    useEffect(() => {
        if (!activityRef.current || !recentActivity?.length) return;
        const items = activityRef.current.querySelectorAll("[data-activity-item]");
        if (!items.length) return;
        animate(items, {
            opacity: [0, 1],
            translateY: [-8, 0],
            delay: stagger(60, { start: 200 }),
            duration: 320,
            ease: "outExpo",
        });
    }, [recentActivity]);

    /* ── Tab change with anime.js stagger ────────────────────────── */
    const handleTabChange = useCallback((key) => {
        setActiveTab(key);
        const els = tabRefs.current.filter(Boolean);
        animate(els, {
            opacity: [0.5, 1],
            translateY: [3, 0],
            duration: 260,
            delay: stagger(35),
            ease: "outExpo",
        });
    }, [setActiveTab]);

    /* ── Active panel ─────────────────────────────────────────────── */
    const activePanel = useMemo(() => {
        switch (activeTab) {
            case "overview":
                return (
                    <AdminOverviewPanel
                        statCards={statCards}
                        systemSnapshot={systemSnapshot}
                        recentActivity={recentActivity}
                        mentorSpotlights={mentorSpotlights}
                        icons={overviewIcons}
                    />
                );
            case "students":
                return (
                    <AdminStudentsPanel
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        gradeOptions={gradeOptions}
                        tierOptions={tierOptions}
                        typeOptions={typeOptions}
                        mentorOptions={mentorOptions}
                        filteredStudents={filteredStudents}
                        allStudents={students}
                        visibleCount={visibleCount}
                        onVisibleCountChange={setVisibleCount}
                        onViewStudent={handleViewStudent}
                        onUpdateStudent={undefined}
                        isReadOnly
                        selectedIds={[]}
                        onToggleSelect={undefined}
                        onResetSelection={undefined}
                        mentorDirectory={mentors}
                        onRefresh={refresh}
                    />
                );
            case "mentors":
                return (
                    <AdminMentorsPanel
                        mentorRoster={mentorRoster}
                        mentorDirectory={mentors}
                    />
                );
            case "analytics":
                return (
                    <AdminAnalyticsPanel
                        successByType={successByType}
                        trendPaths={trendPaths}
                        trendData={trendData}
                        strategyHighlights={strategyHighlights}
                        tierMovement={tierMovement}
                    />
                );
            default:
                return null;
        }
    }, [
        activeTab, statCards, systemSnapshot, recentActivity, mentorSpotlights,
        filters, handleFilterChange, gradeOptions, tierOptions, typeOptions,
        mentorOptions, filteredStudents, students, visibleCount, setVisibleCount, handleViewStudent, mentors,
        refresh, mentorRoster, successByType, trendPaths, trendData,
        strategyHighlights, tierMovement,
    ]);

    return (
        <div ref={pageRef} className="mtss-theme mtss-animated-bg min-h-screen relative overflow-hidden">
            <div className="mtss-bg-overlay" />

            {/* ── Ambient blobs (cheap, no backdrop-filter) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute -top-24 left-[8%]  w-[30rem] h-[30rem] rounded-full bg-[#818cf8] opacity-[0.18] dark:opacity-[0.12] blur-[110px]" />
                <div className="absolute top-[25%] right-[6%] w-[26rem] h-[26rem] rounded-full bg-[#c084fc] opacity-[0.15] dark:opacity-[0.10] blur-[100px]" />
                <div className="absolute bottom-[8%] left-[38%]  w-[22rem] h-[22rem] rounded-full bg-[#22d3ee] opacity-[0.13] dark:opacity-[0.08] blur-[90px]" />
                <div className="absolute top-[55%] left-[3%]  w-[18rem] h-[18rem] rounded-full bg-[#10b981] opacity-[0.10] dark:opacity-[0.07] blur-[80px]" />
            </div>

            <div className="relative z-20 container-tight px-4 sm:px-6 py-8 lg:py-12 space-y-7">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => navigate("/mtss/pilot-testing")}
                        className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        Open Pilot Testing Hub
                    </button>
                </div>

                {/* ════════════════════════════════════════════════
                    HERO CARD — iOS Liquid Glass gradient panel
                ════════════════════════════════════════════════ */}
                <div ref={heroRef} style={{ opacity: 0 }}>
                    <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border border-white/30 dark:border-white/10 bg-gradient-to-br from-[#312e81]/95 via-[#5b21b6]/92 to-[#075985]/88 dark:from-[#1e1b4b]/96 dark:via-[#3b0764]/90 dark:to-[#082f49]/86 shadow-[0_32px_82px_rgba(76,29,149,0.34),0_10px_28px_rgba(15,23,42,0.24)] dark:shadow-[0_28px_72px_rgba(99,102,241,0.16)]">

                        {/* Glass specular highlight */}
                        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.14),transparent_46%,rgba(15,23,42,0.22))]" />
                            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-white/[0.09] blur-[70px]" />
                        </div>

                        <div className="relative p-6 sm:p-8 lg:p-10 space-y-7">

                            {/* ── Badge row ── */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/14 border border-white/28 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                                    <Eye className="w-3.5 h-3.5 opacity-95" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.28em]">Observer Mode</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                                </div>
                                <span className="text-[10px] font-semibold text-white/72 uppercase tracking-widest">
                                    Millennia World School · MTSS
                                </span>
                            </div>

                            {/* ── Title ── */}
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/76 mb-1.5">
                                    Welcome back, {displayName}
                                </p>
                                <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-black text-white leading-tight tracking-tight">
                                    MTSS Executive Overview
                                </h1>
                                <p className="text-sm text-white/82 mt-1.5 font-medium">
                                    All units · Kindergarten → Junior High · View-only access
                                </p>
                            </div>

                            {/* ── Stat Counters (4 columns) ── */}
                            <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x sm:divide-white/16 pb-1">
                                <StatCounter
                                    targetValue={totalStudents}
                                    label="Students in MTSS"
                                    icon={Users2}
                                    accentClass="bg-indigo-500/40 shadow-indigo-500/20"
                                    delay={80}
                                />
                                <StatCounter
                                    targetValue={totalMentors}
                                    label="Active Mentors"
                                    icon={UserCheck}
                                    accentClass="bg-violet-500/40 shadow-violet-500/20"
                                    delay={180}
                                />
                                <StatCounter
                                    targetValue={Math.round(successRate)}
                                    suffix="%"
                                    label="Success Rate"
                                    icon={TrendingUp}
                                    accentClass="bg-emerald-500/40 shadow-emerald-500/20"
                                    delay={280}
                                />
                                <StatCounter
                                    targetValue={tierBreakdown.length}
                                    label="Tier Levels Active"
                                    icon={Brain}
                                    accentClass="bg-rose-500/40 shadow-rose-500/20"
                                    delay={380}
                                />
                            </div>

                            {/* ── Tier breakdown chips ── */}
                            {tierBreakdown.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    {tierBreakdown.slice(0, 3).map((t) => (
                                        <TierChip
                                            key={t.label}
                                            label={t.label}
                                            count={t.count}
                                            total={totalStudents}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ── Tier Movement snapshot (if available) ── */}
                            {tierMovement?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/72 mb-2">
                                        30-day Tier Movement
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {tierMovement.map((item) => (
                                            <TrendBadge key={item.label} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Tab navigation ── */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {TABS.map((tab, i) => {
                                    const Icon = tab.icon;
                                    const active = activeTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            ref={(el) => (tabRefs.current[i] = el)}
                                            type="button"
                                            onClick={() => handleTabChange(tab.key)}
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border focus:outline-none ${
                                                active
                                                    ? "bg-white text-indigo-700 border-white shadow-[0_4px_14px_rgba(255,255,255,0.25)]"
                                                    : "bg-white/12 text-white/86 border-white/24 hover:bg-white/22 hover:text-white hover:border-white/36 active:scale-95"
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════
                    QUICK INSIGHTS ROW — recent activity + strategy highlights
                    (shown only on overview tab for faster context)
                ════════════════════════════════════════════════ */}
                {activeTab === "overview" && (recentActivity?.length > 0 || strategyHighlights?.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" data-aos="fade-up" data-aos-delay="80">

                        {/* Recent activity feed */}
                        {recentActivity?.length > 0 && (
                            <div className="rounded-[24px] border border-slate-200/90 dark:border-white/10 bg-white/88 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_14px_36px_rgba(15,23,42,0.10)] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-indigo-400" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-700 dark:text-slate-300">
                                        Recent Activity
                                    </p>
                                </div>
                                <div ref={activityRef}>
                                    {recentActivity.slice(0, 5).map((item, i) => (
                                        <ActivityItem key={i} item={item} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strategy highlights */}
                        {strategyHighlights?.length > 0 && (
                            <div className="rounded-[24px] border border-slate-200/90 dark:border-white/10 bg-white/88 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_14px_36px_rgba(15,23,42,0.10)] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-700 dark:text-slate-300">
                                        Active Strategies
                                    </p>
                                </div>
                                <div className="space-y-2.5">
                                    {strategyHighlights.slice(0, 6).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                                            <span className="flex-shrink-0 text-xs font-bold text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-700/40 tabular-nums">
                                                {s.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Status / error bar ── */}
                {(loading || error) && (
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border border-border/50 bg-white/70 dark:bg-white/10 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            {error
                                ? <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                                : <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
                            }
                            <span>{error || "Syncing data across all units…"}</span>
                        </div>
                        {error && (
                            <button onClick={refresh} className="text-primary font-semibold hover:underline flex-shrink-0">
                                Retry
                            </button>
                        )}
                    </div>
                )}

                {/* ── Active panel ── */}
                <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="500">
                    <Suspense fallback={<PanelFallback />}>
                        {activePanel}
                    </Suspense>
                </div>

            </div>
        </div>
    );
});

ObserverDashboardPage.displayName = "ObserverDashboardPage";
export default ObserverDashboardPage;
