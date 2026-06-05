import React, { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import {
    AlertTriangle, ArrowLeft, Bell, BellOff, BookOpen, CalendarClock,
    ChevronDown, Clock, Hash, Layers, Lightbulb, Mail, MailCheck, MailX,
    Moon, Sparkles, TrendingDown, Zap,
} from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/authService";

// ─── data ─────────────────────────────────────────────────────────────────────

const DELIVERY_MODES = [
    { value: "digest_daily", label: "Daily",   icon: MailCheck, color: "text-emerald-500 dark:text-emerald-400" },
    { value: "immediate",    label: "Instant",  icon: Bell,      color: "text-sky-500 dark:text-sky-400"     },
    { value: "dashboard_only", label: "In-app", icon: BellOff,   color: "text-slate-500 dark:text-slate-400" },
];

const DELIVERY_DESC = {
    digest_daily:    "One email per day — all updates bundled, no spam.",
    immediate:       "Email per update, up to 5 every 2 hours.",
    dashboard_only:  "No emails. Check the app for updates.",
};

const ALERT_TYPES = [
    { key: "intervention_needed",    label: "Intervention",  icon: AlertTriangle, dot: "bg-red-500"    },
    { key: "academic_struggle",      label: "Academic",      icon: BookOpen,      dot: "bg-orange-400" },
    { key: "progress_decline",       label: "Decline",       icon: TrendingDown,  dot: "bg-amber-400"  },
    { key: "emotional_pattern",      label: "Emotional",     icon: Zap,           dot: "bg-violet-400" },
    { key: "breakthrough",           label: "Breakthrough",  icon: Sparkles,      dot: "bg-emerald-400"},
    { key: "learning_style_detected",label: "Learning",      icon: Lightbulb,     dot: "bg-sky-400"    },
    { key: "engagement_low",         label: "Engagement",    icon: Bell,          dot: "bg-slate-400"  },
];

const SEV_OPTS = [
    { value: "low",    label: "All"     },
    { value: "medium", label: "Med+"    },
    { value: "high",   label: "High+"   },
    { value: "urgent", label: "Urgent"  },
];

const ADVANCE_OPTS = [
    { value: 0, label: "Off"        },
    { value: 1, label: "1 day"      },
    { value: 2, label: "2 days"     },
    { value: 3, label: "3 days"     },
    { value: 7, label: "1 week"     },
];

const DEFAULT_ALERT_PREFS = {
    academic_struggle:       { enabled: false, minSeverity: "medium" },
    learning_style_detected: { enabled: false, minSeverity: "low"    },
    emotional_pattern:       { enabled: false, minSeverity: "medium" },
    progress_decline:        { enabled: false, minSeverity: "medium" },
    engagement_low:          { enabled: false, minSeverity: "medium" },
    breakthrough:            { enabled: false, minSeverity: "low"    },
    intervention_needed:     { enabled: false, minSeverity: "urgent" },
};

const SAVE_DEBOUNCE_MS = 800;

// ─── tiny components ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange, size = "md" }) {
    const w = size === "sm" ? "w-9 h-5" : "w-11 h-6";
    const knob = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    const tx = checked ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0.5";
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex shrink-0 items-center rounded-full ring-1 ring-border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${w} ${checked ? "bg-primary" : "bg-muted/50"}`}
        >
            <span className={`inline-block transform rounded-full bg-white dark:bg-slate-200 shadow transition-transform duration-200 ${knob} ${tx}`} />
        </button>
    );
}

function Chip({ children, className = "" }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
            {children}
        </span>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
    const reduce = useReducedMotion();
    const { toast } = useToast();

    const [loading, setLoading]             = useState(true);
    const [saveLabel, setSaveLabel]         = useState("idle"); // idle | saving | saved | error

    const [deliveryMode, setDeliveryMode]   = useState("dashboard_only");
    const [dailyTime, setDailyTime]         = useState("08:00");
    const [emailEnabled, setEmailEnabled]   = useState(false);
    const [quietEnabled, setQuietEnabled]   = useState(false);
    const [quietStart, setQuietStart]       = useState("18:00");
    const [quietEnd, setQuietEnd]           = useState("07:00");
    const [quietWeekends, setQuietWeekends] = useState(false);
    const [alertPrefs, setAlertPrefs]       = useState(DEFAULT_ALERT_PREFS);
    const [advanceDays, setAdvanceDays]     = useState(0);
    const [smartGroup, setSmartGroup]       = useState(false);
    const [slackEnabled, setSlackEnabled]   = useState(false);

    const [alertOpen, setAlertOpen]         = useState(false);

    const readyRef   = useRef(false);
    const timerRef   = useRef(null);
    const labelTimer = useRef(null);

    // ── load ─────────────────────────────────────────────────────────────
    useEffect(() => {
        let dead = false;
        api.get("/notifications/preferences")
            .then((res) => {
                if (dead) return;
                const d = res.data?.data || res.data || {};
                setDeliveryMode(d.deliveryMode || "dashboard_only");
                setDailyTime(d.digestSchedule?.dailyTime || "08:00");
                setEmailEnabled(d.emailNotifications?.enabled === true);
                setQuietEnabled(d.quietHours?.enabled === true);
                setQuietStart(d.quietHours?.start || "18:00");
                setQuietEnd(d.quietHours?.end   || "07:00");
                setQuietWeekends(d.quietHours?.weekendsOnly || false);
                setAlertPrefs(d.alertPreferences || DEFAULT_ALERT_PREFS);
                setAdvanceDays(d.advanceNoticeDays ?? 0);
                setSmartGroup(d.smartSummary?.enabled === true);
                setSlackEnabled(d.slackNotifications?.enabled === true);
            })
            .catch(() => {
                if (!dead) toast({ title: "Could not load preferences", variant: "destructive", duration: 3000 });
            })
            .finally(() => {
                if (!dead) { setLoading(false); setTimeout(() => { readyRef.current = true; }, 50); }
            });
        return () => { dead = true; };
    }, []); // eslint-disable-line

    // ── helpers ───────────────────────────────────────────────────────────
    const setAlertPref = useCallback((key, field, val) => {
        setAlertPrefs((p) => ({ ...p, [key]: { ...p[key], [field]: val } }));
    }, []);

    // ── auto-save ─────────────────────────────────────────────────────────
    const save = useCallback(async (payload) => {
        setSaveLabel("saving");
        clearTimeout(labelTimer.current);
        try {
            await api.put("/notifications/preferences", payload);
            setSaveLabel("saved");
            labelTimer.current = setTimeout(() => setSaveLabel("idle"), 1800);
        } catch {
            setSaveLabel("error");
            labelTimer.current = setTimeout(() => setSaveLabel("idle"), 3000);
            toast({ title: "Could not save", variant: "destructive", duration: 3000 });
        }
    }, [toast]);

    useEffect(() => {
        if (!readyRef.current) return;
        const p = {
            deliveryMode, digestSchedule: { dailyTime },
            emailNotifications: { enabled: emailEnabled },
            quietHours: { enabled: quietEnabled, start: quietStart, end: quietEnd, weekendsOnly: quietWeekends },
            alertPreferences: alertPrefs, advanceNoticeDays: advanceDays,
            smartSummary: { enabled: smartGroup },
            slackNotifications: { enabled: slackEnabled },
        };
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => save(p), SAVE_DEBOUNCE_MS);
    }, [deliveryMode, dailyTime, emailEnabled, quietEnabled, quietStart, quietEnd, quietWeekends, alertPrefs, advanceDays, smartGroup, slackEnabled, save]);

    useEffect(() => () => { clearTimeout(timerRef.current); clearTimeout(labelTimer.current); }, []);

    // ── motion ─────────────────────────────────────────────────────────────
    const fadeUp = reduce
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.24 } } };

    const stagger = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.05 } } };

    const statusText = {
        idle:   "Changes save automatically",
        saving: "Saving…",
        saved:  "Saved",
        error:  "Save failed — check connection",
    }[saveLabel];

    const statusColor = {
        idle:   "text-muted-foreground",
        saving: "text-muted-foreground animate-pulse",
        saved:  "text-emerald-600 dark:text-emerald-400",
        error:  "text-destructive",
    }[saveLabel];

    return (
        <AnimatedPage>
            <Helmet><title>Notification Settings — MWS IntegraLearn</title></Helmet>
            <MotionConfig reducedMotion="user">
                <motion.div
                    initial="hidden"
                    animate={loading ? "hidden" : "show"}
                    variants={stagger}
                    className="mx-auto max-w-md px-4 pt-5 pb-16 space-y-5"
                >

                    {/* ─── Header ───────────────────────────────────────── */}
                    <motion.div variants={fadeUp} className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild
                            className="rounded-full h-9 w-9 shrink-0 bg-card/50 backdrop-blur hover:bg-card/80">
                            <Link to={-1} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-semibold text-foreground leading-none">Notification Settings</h1>
                            <p className={`text-[11px] mt-0.5 transition-colors duration-300 ${statusColor}`}>
                                {statusText}
                            </p>
                        </div>
                    </motion.div>

                    {/* ─── Delivery mode ────────────────────────────────── */}
                    <motion.div variants={fadeUp} className="space-y-2">
                        <Label>How you receive</Label>

                        {/* Segmented selector */}
                        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/40 p-1">
                            {DELIVERY_MODES.map(({ value, label, icon: Icon, color }) => {
                                const active = deliveryMode === value;
                                return (
                                    <button key={value} onClick={() => setDeliveryMode(value)}
                                        className={`flex flex-col items-center gap-1.5 rounded-xl py-3.5 transition-all duration-200 ${
                                            active ? "bg-card shadow-sm ring-1 ring-border/60" : "hover:bg-muted/60"
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 transition-colors ${active ? color : "text-muted-foreground"}`} />
                                        <span className={`text-xs font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Delivery description */}
                        <p className="text-[12px] text-muted-foreground px-1">
                            {DELIVERY_DESC[deliveryMode]}
                        </p>

                        {/* Digest time — only when relevant */}
                        <AnimatePresence>
                            {(deliveryMode === "digest_daily" || deliveryMode === "digest_weekly") && (
                                <motion.div
                                    key="digest-time"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <Row icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
                                         label="Send time">
                                        <input type="time" value={dailyTime}
                                            onChange={(e) => setDailyTime(e.target.value)}
                                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </Row>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ─── Quick controls ───────────────────────────────── */}
                    <motion.div variants={fadeUp} className="space-y-2">
                        <Label>Controls</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <QuickCard
                                icon={<Layers className="h-4 w-4" />}
                                label="Smart Summary"
                                sub={smartGroup ? "Groups alerts" : "Off"}
                                checked={smartGroup}
                                onChange={setSmartGroup}
                            />
                            <QuickCard
                                icon={emailEnabled ? <Mail className="h-4 w-4" /> : <MailX className="h-4 w-4" />}
                                label="Email"
                                sub={emailEnabled ? "Active" : "Off"}
                                checked={emailEnabled}
                                onChange={setEmailEnabled}
                            />
                            <QuickCard
                                icon={<Hash className="h-4 w-4" />}
                                label="Slack"
                                sub={slackEnabled ? "DM alerts" : "Off"}
                                checked={slackEnabled}
                                onChange={setSlackEnabled}
                            />
                        </div>

                        {/* Advance notice */}
                        <Row icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
                             label="Advance reminder">
                            <select value={advanceDays}
                                onChange={(e) => setAdvanceDays(Number(e.target.value))}
                                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                {ADVANCE_OPTS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </Row>
                    </motion.div>

                    {/* ─── Alert types (collapsible) ────────────────────── */}
                    <motion.div variants={fadeUp} className="space-y-2">
                        <button
                            onClick={() => setAlertOpen((v) => !v)}
                            className="w-full flex items-center justify-between"
                            aria-expanded={alertOpen}
                        >
                            <Label as="span">Alert types</Label>
                            <div className="flex items-center gap-2">
                                <Chip className="bg-muted text-muted-foreground">
                                    {ALERT_TYPES.filter((t) => alertPrefs[t.key]?.enabled !== false).length}/{ALERT_TYPES.length} on
                                </Chip>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${alertOpen ? "rotate-180" : ""}`} />
                            </div>
                        </button>

                        <AnimatePresence initial={false}>
                            {alertOpen && (
                                <motion.div
                                    key="alert-list"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden"
                                >
                                    <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
                                        {ALERT_TYPES.map(({ key, label, dot }, i) => {
                                            const pref = alertPrefs[key] || { enabled: true, minSeverity: "medium" };
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/40" : ""}`}
                                                >
                                                    <span className={`shrink-0 h-2 w-2 rounded-full ${dot} ${!pref.enabled ? "opacity-30" : ""}`} />
                                                    <span className={`flex-1 text-sm transition-colors ${pref.enabled ? "text-foreground" : "text-muted-foreground/60"}`}>
                                                        {label}
                                                    </span>
                                                    <AnimatePresence>
                                                        {pref.enabled && (
                                                            <motion.select
                                                                key="sev"
                                                                initial={{ opacity: 0, width: 0 }}
                                                                animate={{ opacity: 1, width: "auto" }}
                                                                exit={{ opacity: 0, width: 0 }}
                                                                value={pref.minSeverity}
                                                                onChange={(e) => setAlertPref(key, "minSeverity", e.target.value)}
                                                                className="rounded-lg border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mr-2"
                                                            >
                                                                {SEV_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                            </motion.select>
                                                        )}
                                                    </AnimatePresence>
                                                    <Toggle size="sm"
                                                        checked={pref.enabled}
                                                        onChange={(v) => setAlertPref(key, "enabled", v)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ─── Quiet hours (collapsible) ────────────────────── */}
                    <motion.div variants={fadeUp} className="space-y-2">
                        <Label>Schedule</Label>
                        <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3.5">
                                <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="flex-1 text-sm font-medium text-foreground">Quiet hours</span>
                                {quietEnabled && (
                                    <span className="text-xs text-muted-foreground mr-2 tabular-nums">
                                        {quietStart} – {quietEnd}
                                    </span>
                                )}
                                <Toggle checked={quietEnabled} onChange={setQuietEnabled} />
                            </div>

                            <AnimatePresence initial={false}>
                                {quietEnabled && (
                                    <motion.div
                                        key="qh"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-border/40 px-4 py-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span className="text-xs text-muted-foreground w-8">From</span>
                                                <input type="time" value={quietStart}
                                                    onChange={(e) => setQuietStart(e.target.value)}
                                                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                                <span className="text-xs text-muted-foreground">to</span>
                                                <input type="time" value={quietEnd}
                                                    onChange={(e) => setQuietEnd(e.target.value)}
                                                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground flex-1">Weekends only</span>
                                                <Toggle size="sm" checked={quietWeekends} onChange={setQuietWeekends} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* ─── Tip ─────────────────────────────────────────── */}
                    <motion.div variants={fadeUp}
                        className="rounded-2xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 px-4 py-3 flex gap-2.5"
                    >
                        <span className="text-sm shrink-0">💡</span>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            Best combo: <strong>Daily</strong> + <strong>Smart Group</strong> + <strong>1-day reminder</strong> — one clean morning email, no noise.
                        </p>
                    </motion.div>

                </motion.div>
            </MotionConfig>
        </AnimatedPage>
    );
}

// ─── layout helpers ───────────────────────────────────────────────────────────

function Label({ children, as: Tag = "p" }) {
    return (
        <Tag className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
            {children}
        </Tag>
    );
}

function Row({ icon, label, children }) {
    return (
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 flex items-center gap-3">
            <span className="shrink-0">{icon}</span>
            <span className="flex-1 text-sm text-foreground">{label}</span>
            {children}
        </div>
    );
}

function QuickCard({ icon, label, sub, checked, onChange }) {
    return (
        <div className="rounded-2xl border border-border bg-card/60 px-3.5 py-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <span className={`transition-colors ${checked ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
                <Toggle size="sm" checked={checked} onChange={onChange} />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground leading-none">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
        </div>
    );
}
