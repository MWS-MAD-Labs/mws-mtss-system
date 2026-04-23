import { useMemo, useState, useCallback, useEffect, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    ArrowLeft,
    User,
    Shield,
    Bell,
    LogOut,
    ChevronRight,
    Star,
    CheckCircle,
    Award,
    TrendingUp,
    Calendar,
    Activity,
    BarChart3,
    UserCog,
    Heart,
    Flame,
    Gauge,
    PieChart,
    Sparkles,
    Zap,
    Sun
} from "lucide-react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
const getCheckinHistory = () => ({ type: 'noop/getCheckinHistory' });
const getPersonalDashboard = () => ({ type: 'noop/getPersonalDashboard' });
import { logoutUser } from "../store/slices/authSlice";
import { useToast } from "@/components/ui/use-toast";
import {
    hasEmotionalDashboardAccess,
    getEmotionalDashboardRole,
    hasDelegatedDashboardAccess,
    getDelegatedDashboardDetails
} from "@/utils/accessControl";
import useThrottledCallback from "@/hooks/useThrottledCallback";

/* ---------------------- Helpers ---------------------- */
const fmtShort = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);

const sanitizeInput = (value) => {
    return String(value || "")
        .replace(/[<>]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/(script|onerror|onload|data:|vbscript:)/gi, "")
        .trim()
        .slice(0, 300);
};

const formatMetricValue = (value, fractionDigits = 1) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '–';
    const fixed = value.toFixed(fractionDigits);
    return fixed.includes('.') ? fixed.replace(/\.0+$/, '') : fixed;
};

const formatDateLabel = (value, options = { day: 'numeric', month: 'short' }) => {
    if (!value) return '-';
    try {
        return new Intl.DateTimeFormat('id-ID', options).format(new Date(value));
    } catch {
        return '-';
    }
};

const formatWeekdayLabel = (value) => {
    if (!value) return '';
    try {
        return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(value));
    } catch {
        return '';
    }
};

const getTier = (completed) => {
    if (completed >= 200) return { label: "Gold", icon: Award, color: "text-gold" };
    if (completed >= 100) return { label: "Silver", icon: Star, color: "text-slate-400" };
    return { label: "Bronze", icon: CheckCircle, color: "text-amber-600" };
};

// Time-aware, varied greeting builders
const getTimeOfDay = (date = new Date()) => {
    const h = date.getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'evening';
    return 'night';
};

const pickVariant = (key, variants) => {
    // Deterministic-ish selection per day without flicker
    const seed = (typeof key === 'string' ? key : JSON.stringify(key)) + new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return variants[hash % variants.length];
};

export const getDynamicGreeting = (user, titledName) => {
    const tod = getTimeOfDay();
    const base = {
        morning: [
            `Good morning, ${titledName}`,
            `Morning, ${titledName}`,
            `A bright start, ${titledName}`
        ],
        afternoon: [
            `Good afternoon, ${titledName}`,
            `Hope your afternoon’s going well, ${titledName}`,
            `Great to see you, ${titledName}`
        ],
        evening: [
            `Good evening, ${titledName}`,
            `Wishing you a calm evening, ${titledName}`,
            `Nice to have you here, ${titledName}`
        ],
        night: [
            `Good evening, ${titledName}`,
            `Late session, ${titledName}?` ,
            `Hello, ${titledName}`
        ]
    };
    return pickVariant(user?.email || titledName, base[tod]);
};

const CHECKIN_USAGE_KEY = "mws_emotional_checkin_usage";
const MAX_DAILY_EMOTIONAL_CHECKINS = 2;
const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000;

const getWindowStartTimestamp = () => {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(6, 0, 0, 0);
    if (now < windowStart) {
        windowStart.setDate(windowStart.getDate() - 1);
    }
    return windowStart.getTime();
};

const getNextResetTimestamp = (windowStart) => windowStart + WINDOW_DURATION_MS;

const readCheckinUsageSnapshot = () => {
    const windowStart = getWindowStartTimestamp();
    const nextReset = getNextResetTimestamp(windowStart);

    if (typeof window === "undefined") {
        return { windowStart, nextReset, count: 0 };
    }

    try {
        const stored = JSON.parse(localStorage.getItem(CHECKIN_USAGE_KEY) || "{}");
        if (stored?.windowStart === windowStart) {
            return {
                windowStart,
                nextReset,
                count: Number(stored.count) || 0
            };
        }
    } catch {
        // ignore parsing errors
    }

    return { windowStart, nextReset, count: 0 };
};

const persistCheckinUsageSnapshot = (snapshot) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
        CHECKIN_USAGE_KEY,
        JSON.stringify({
            windowStart: snapshot.windowStart,
            count: snapshot.count
        })
    );
};

const formatResetTimeLabel = (timestamp) => {
    try {
        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(timestamp));
    } catch {
        return "06:00";
    }
};

export const getDynamicSubGreeting = () => {
    const variants = [
        'Your wellness overview is ready',
        'Here are your latest insights',
        'Wishing you a productive day',
        'Stay present and take a breath'
    ];
    return pickVariant('sub'+new Date().toDateString(), variants);
};

/* ---------------------- Decorative Elements ---------------------- */
const DecorativeBlob = memo(({ className, delay = 0 }) => (
    <motion.div
        className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
            scale: [1, 1.12, 1],
            opacity: [0.08, 0.15, 0.08]
        }}
        transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay
        }}
    />
));

const GridPattern = memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.015]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="profile-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#profile-grid)" className="text-foreground" />
        </svg>
    </div>
));

/* ---------------------- Optimized Components ---------------------- */
const GlassCard = memo(({ children, className = "", variant = "default" }) => {
    const baseClasses = "glass glass-card transition-all duration-300";
    const variants = {
        default: "",
        elevated: "glass--deep hover-lift",
        compact: "p-3"
    };

    return (
        <div className={`${baseClasses} ${variants[variant]} ${className}`}>
            <div className="glass__noise" />
            <div className="glass__refract" />
            {children}
        </div>
    );
});

const IconContainer = memo(({ children, size = "md", variant = "default" }) => {
    const sizes = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
    };

    const variants = {
        default: "bg-secondary/20 border border-border/50",
        accent: "bg-primary/10 border border-primary/20",
        muted: "bg-muted/30 border border-muted"
    };

    return (
        <div className={`flex items-center justify-center rounded-xl ${sizes[size]} ${variants[variant]} transition-colors duration-300`}>
            {children}
        </div>
    );
});

const MenuItem = memo(function MenuItem({
    icon: Icon,
    title,
    to,
    compact = false,
    onClick,
    disabled = false,
    description,
    featured = false,
    badge,
}) {
    const baseClasses = featured
        ? "flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-gradient-to-r from-[#ff87c5] via-[#f472b6] to-primary px-5 py-4 text-white shadow-[0_20px_45px_rgba(244,114,182,0.35)] transition-all duration-300 hover:shadow-[0_26px_60px_rgba(244,114,182,0.45)] hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-white/40 group-focus-visible:ring-offset-2"
        : `flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-glass-sm ${compact ? 'px-3 py-2.5' : ''}`;
    const contentClasses = `${baseClasses} ${disabled ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none' : ''}`;

    const iconNode = featured ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner">
            <Icon className="h-5 w-5" />
        </div>
    ) : (
        <IconContainer size={compact ? "sm" : "md"}>
            <Icon className={`text-foreground/80 transition-colors duration-300 group-hover:text-primary ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        </IconContainer>
    );

    const descriptionNode = description ? (
        <p className={`text-xs truncate ${featured ? 'text-white/85' : 'text-muted-foreground'}`}>
            {description}
        </p>
    ) : null;

    const badgeNode = badge ? (
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${featured ? 'bg-white/20 text-white/95' : 'bg-primary/10 text-primary/80'}`}>
            {badge}
        </span>
    ) : null;

    const chevronClasses = `${featured ? 'text-white/90' : 'text-muted-foreground'} transition-transform duration-300 group-hover:translate-x-0.5 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`;

    const content = (
        <div className={contentClasses}>
            <div className="flex items-center gap-3">
                {iconNode}
                <div className="flex flex-col min-w-0">
                    <div className={`font-medium truncate ${featured ? 'text-base text-white' : 'text-sm text-foreground transition-colors duration-300 group-hover:text-primary'}`}>
                        {title}
                    </div>
                    {descriptionNode}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {badgeNode}
                <ChevronRight className={chevronClasses} />
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                aria-disabled={disabled}
                className={`block w-full text-left group ${disabled ? 'cursor-not-allowed' : ''}`}
            >
                {content}
            </button>
        );
    }

    return (
        <Link to={to} className={`block group ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
            {content}
        </Link>
    );
});

const ActionCard = memo(function ActionCard({ icon: Icon, label, hint, to, compact = false }) {
    return (
        <Link to={to} className="block group">
            <div className={`flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:bg-primary/5 hover:shadow-glass-sm ${compact ? 'px-3 py-2.5 gap-2' : ''}`}>
                <div className="flex items-center gap-2">
                    <IconContainer size={compact ? "sm" : "md"} variant="accent">
                        <Icon className={`text-primary transition-colors duration-300 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </IconContainer>
                    <div className="text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
                        {label}
                    </div>
                </div>
                <div className={`text-muted-foreground transition-colors duration-300 group-hover:text-primary/70 ${compact ? 'text-xs' : 'text-xs'}`}>
                    {hint}
                </div>
            </div>
        </Link>
    );
});

const StudentQuickCard = memo(function StudentQuickCard({ title, hint, icon: Icon, to, onClick, highlight = false }) {
    const baseClass = highlight
        ? "rounded-2xl border border-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 text-white shadow-[0_18px_45px_rgba(236,72,153,0.35)]"
        : "rounded-2xl border border-white/60 bg-white/70 text-foreground backdrop-blur-xl shadow-sm";

    const content = (
        <div className={`group flex items-center justify-between gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${baseClass}`}>
            <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${highlight ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${highlight ? 'text-white' : 'text-foreground'}`}>{title}</p>
                    <p className={`text-xs truncate ${highlight ? 'text-white/85' : 'text-muted-foreground'}`}>{hint}</p>
                </div>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${highlight ? 'text-white/90' : 'text-muted-foreground'}`} />
        </div>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className="block w-full text-left">
                {content}
            </button>
        );
    }

    return (
        <Link to={to} className="block">
            {content}
        </Link>
    );
});

/* ── Scoped CSS animations for student profile (same pattern as StudentSupportHubPage) ── */
const ProfileScopedStyles = memo(() => (
    <style>{`
        @keyframes spBgShift{0%{background-position:0% 0%}25%{background-position:50% 100%}50%{background-position:100% 50%}75%{background-position:50% 0%}100%{background-position:0% 0%}}
        .sp-bg{background-size:300% 300%;animation:spBgShift 16s ease infinite}
        :is(.dark) .sp-bg{animation:none}
        .sp-grid{background-image:radial-gradient(circle,rgba(0,0,0,.04) 1px,transparent 1px);background-size:24px 24px}
        :is(.dark) .sp-grid{background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)}
        @keyframes spTextShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .sp-title{font-family:'Nunito','Inter',system-ui,sans-serif;background-size:200% 200%;animation:spTextShimmer 4s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .sp-font{font-family:'Nunito','Inter',system-ui,-apple-system,sans-serif;letter-spacing:-0.01em}
        @keyframes spBlob{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(12px,-8px) scale(1.04) rotate(1deg)}50%{transform:translate(-4px,10px) scale(.97) rotate(-1deg)}75%{transform:translate(-10px,-4px) scale(1.02) rotate(.5deg)}}
        @keyframes spFloat{0%,100%{transform:translateY(0) scale(1);opacity:.55}50%{transform:translateY(-10px) scale(1.12);opacity:.85}}
        @keyframes spSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes spPulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.25);opacity:.7}}
        @keyframes spDrift{0%,100%{transform:translateX(0) translateY(0)}33%{transform:translateX(6px) translateY(-4px)}66%{transform:translateX(-4px) translateY(6px)}}
        .sp-card{transition:transform .3s cubic-bezier(.22,.68,0,1.1),box-shadow .3s ease}
        .sp-card:active{transform:scale(.97)}
        @media(hover:hover){.sp-card:hover{transform:translateY(-4px)}}
    `}</style>
));
ProfileScopedStyles.displayName = "ProfileScopedStyles";

/* ── Profile particles (same technique as Hub) ── */
const spParticles = [
    { t:'dot', top:'4%',  left:'8%',   sz:7,  cl:'bg-rose-300 dark:bg-rose-500/25',     anim:'spFloat', dur:4.2, del:0 },
    { t:'dot', top:'12%', right:'12%',  sz:6,  cl:'bg-amber-300 dark:bg-amber-500/25',   anim:'spFloat', dur:5,   del:1 },
    { t:'dot', top:'35%', left:'5%',    sz:8,  cl:'bg-violet-300 dark:bg-violet-500/25', anim:'spFloat', dur:4.5, del:0.5 },
    { t:'dot', top:'58%', right:'7%',   sz:5,  cl:'bg-sky-300 dark:bg-sky-500/25',       anim:'spFloat', dur:5.5, del:2 },
    { t:'dot', top:'78%', left:'14%',   sz:6,  cl:'bg-emerald-300 dark:bg-emerald-500/25',anim:'spFloat',dur:3.8, del:1.5 },
    { t:'dot', top:'88%', right:'18%',  sz:7,  cl:'bg-orange-300 dark:bg-orange-500/25', anim:'spFloat', dur:4.8, del:1.2 },
    { t:'ring', top:'8%',  left:'22%',  sz:14, cl:'border-rose-300/50 dark:border-rose-500/20',   anim:'spPulse', dur:5,   del:0.3 },
    { t:'ring', top:'52%', right:'9%',  sz:12, cl:'border-violet-300/50 dark:border-violet-500/20',anim:'spPulse', dur:6,   del:1.8 },
    { t:'ring', top:'82%', left:'6%',   sz:10, cl:'border-amber-300/50 dark:border-amber-500/20',  anim:'spPulse', dur:4.5, del:2.5 },
    { t:'cross', top:'20%', left:'5%',  sz:10, cl:'bg-fuchsia-300/60 dark:bg-fuchsia-500/20', anim:'spSpin', dur:12, del:0 },
    { t:'cross', top:'68%', right:'6%', sz:8,  cl:'bg-emerald-300/60 dark:bg-emerald-500/20', anim:'spSpin', dur:15, del:2 },
    { t:'diamond', top:'15%', right:'20%', sz:7, cl:'bg-orange-300/50 dark:bg-orange-500/20', anim:'spDrift', dur:6,   del:1 },
    { t:'diamond', top:'72%', left:'20%',  sz:6, cl:'bg-sky-300/50 dark:bg-sky-500/20',      anim:'spDrift', dur:7,   del:2.5 },
    { t:'diamond', top:'45%', right:'16%', sz:5, cl:'bg-yellow-300/60 dark:bg-yellow-500/20', anim:'spPulse', dur:4,   del:1.5 },
];

const SpParticle = memo(({ p }) => {
    const pos = { top: p.top, bottom: p.bottom, left: p.left, right: p.right };
    const base = 'absolute pointer-events-none';
    const anim = { animation: `${p.anim} ${p.dur}s ease-in-out infinite`, animationDelay: `${p.del}s` };
    if (p.t === 'ring') return <div className={`${base} rounded-full border-[1.5px] ${p.cl}`} style={{ ...pos, width: p.sz, height: p.sz, ...anim }} />;
    if (p.t === 'cross') return (
        <div className={base} style={{ ...pos, width: p.sz, height: p.sz, ...anim }}>
            <div className={`absolute top-1/2 left-0 w-full h-[1.5px] -translate-y-1/2 rounded-full ${p.cl}`} />
            <div className={`absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 rounded-full ${p.cl}`} />
        </div>
    );
    if (p.t === 'diamond') return <div className={`${base} ${p.cl} rounded-[1px]`} style={{ ...pos, width: p.sz, height: p.sz, transform: 'rotate(45deg)', ...anim }} />;
    return <div className={`${base} rounded-full ${p.cl}`} style={{ ...pos, width: p.sz, height: p.sz, ...anim }} />;
});
SpParticle.displayName = "SpParticle";

/* ── Quick adventure card config ── */
const studentAdventures = [
    { id: 'checkin', title: 'Emotional Check-in', desc: 'Quick mood check or AI facial analysis', icon: Heart, path: null, tag: 'Wellness', iconBg: 'from-rose-400 to-orange-400', accent: 'from-rose-400/25 via-pink-300/15 to-transparent', tagCl: 'text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15', iconShadow: 'shadow-rose-400/30', featured: true },
    { id: 'hub', title: 'Support Hub', desc: 'Choose your wellbeing activity', icon: Sparkles, path: '/student/support-hub', tag: 'Hub', iconBg: 'from-violet-400 to-blue-400', accent: 'from-violet-400/25 via-blue-300/15 to-transparent', tagCl: 'text-violet-600 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/15', iconShadow: 'shadow-violet-400/30' },
    { id: 'history', title: 'Emotional History', desc: 'Look at your reflection journey', icon: Calendar, path: '/profile/emotional-history', tag: 'Journey', iconBg: 'from-sky-400 to-cyan-400', accent: 'from-sky-400/25 via-cyan-300/15 to-transparent', tagCl: 'text-sky-600 bg-sky-500/10 dark:text-sky-400 dark:bg-sky-500/15', iconShadow: 'shadow-sky-400/30' },
    { id: 'insights', title: 'Emotion Insights', desc: 'See your personal trends', icon: Activity, path: '/profile/emotional-patterns', tag: 'Trends', iconBg: 'from-emerald-400 to-teal-400', accent: 'from-emerald-400/25 via-teal-300/15 to-transparent', tagCl: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15', iconShadow: 'shadow-emerald-400/30' },
];

const StudentProfileView = memo(function StudentProfileView({
    currentUser,
    user,
    todayCard,
    overallCard,
    insights,
    recentSnapshots,
    checkinDescription,
    checkinLimitReached,
    remainingCheckins,
    onBack,
    onStartCheckin,
    onOpenLogout
}) {
    const navigate = useNavigate();
    const displayName = useMemo(() => {
        const raw = sanitizeInput(currentUser?.nickname || currentUser?.username || currentUser?.name || "Student");
        return raw.split(" ")[0] || "Student";
    }, [currentUser]);

    const streakDays = overallCard?.streaks?.current || 0;
    const totalCheckins = overallCard?.totalCheckins || user?.completed || 0;
    const latestInsight = insights?.[0] || "Keep taking small mindful pauses between classes.";

    return (
        <>
            <ProfileScopedStyles />
            <div className="sp-bg sp-font min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 via-50% to-violet-50 dark:from-background dark:via-background dark:to-background">
                {/* Dot-grid */}
                <div className="sp-grid absolute inset-0 pointer-events-none" />

                {/* Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-16 w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full blur-3xl bg-gradient-to-br from-rose-200/50 via-orange-200/35 to-amber-100/25 dark:from-rose-500/8 dark:via-orange-500/4 dark:to-transparent" style={{ animation: 'spBlob 10s ease-in-out infinite' }} />
                    <div className="absolute -bottom-16 -left-16 w-72 sm:w-[380px] h-72 sm:h-[380px] rounded-full blur-3xl bg-gradient-to-br from-violet-200/50 via-blue-200/35 to-sky-100/25 dark:from-violet-500/8 dark:via-blue-500/4 dark:to-transparent" style={{ animation: 'spBlob 12s ease-in-out infinite', animationDelay: '3s' }} />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl bg-gradient-to-br from-amber-100/45 via-yellow-100/25 to-transparent dark:from-amber-500/5 dark:to-transparent" style={{ animation: 'spBlob 9s ease-in-out infinite', animationDelay: '1.5s' }} />
                    <div className="absolute bottom-[10%] right-[5%] w-60 sm:w-72 h-60 sm:h-72 rounded-full blur-3xl bg-gradient-to-br from-emerald-100/40 via-teal-100/25 to-transparent dark:from-emerald-500/5 dark:to-transparent" style={{ animation: 'spBlob 11s ease-in-out infinite', animationDelay: '5s' }} />
                    <div className="absolute top-[5%] -left-10 w-52 sm:w-64 h-52 sm:h-64 rounded-full blur-3xl bg-gradient-to-br from-pink-100/40 via-fuchsia-100/20 to-transparent dark:from-pink-500/5 dark:to-transparent" style={{ animation: 'spBlob 8s ease-in-out infinite', animationDelay: '2s' }} />
                    {spParticles.map((p, i) => <SpParticle key={i} p={p} />)}
                </div>

                {/* Content */}
                <div className="relative z-10 mx-auto max-w-lg px-4 pt-8 pb-10 sm:pt-12 sm:pb-16">

                    {/* Back + pill header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-between mb-6"
                    >
                        <button onClick={onBack} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 dark:bg-white/8 border border-white/80 dark:border-white/10 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-gray-200/40 dark:border-white/10 backdrop-blur-sm shadow-sm">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span className="text-[11px] font-extrabold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Your Profile</span>
                        </div>
                    </motion.div>

                    {/* Hero heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="text-center mb-5"
                    >
                        {/* Avatar */}
                        <motion.div
                            className="mx-auto mb-3 relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-400 via-violet-400 to-sky-400 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-lg"
                            whileHover={{ scale: 1.06, rotate: 2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {user?.initials || "S"}
                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 border-[2.5px] border-white dark:border-gray-900 flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white" />
                            </div>
                        </motion.div>

                        <h1 className="text-[1.65rem] sm:text-4xl font-black leading-tight mb-1">
                            <span className="text-gray-700 dark:text-white">Hi {displayName} </span>
                            <motion.span
                                className="inline-block origin-bottom-right"
                                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                                role="img" aria-label="wave"
                            >👋</motion.span>
                        </h1>
                        <p className="sp-title bg-gradient-to-r from-rose-500 via-amber-500 via-40% to-violet-500 dark:from-rose-400 dark:via-amber-400 dark:to-violet-400 text-base sm:text-lg font-extrabold">
                            {checkinDescription}
                        </p>
                        <p className="mt-1 text-[13px] sm:text-sm text-gray-400 dark:text-gray-500 font-medium">
                            {sanitizeInput(currentUser?.currentGrade || "Grade")} - {sanitizeInput(currentUser?.className || "Class")}
                        </p>
                    </motion.div>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.12 }}
                        className="flex items-center justify-center gap-2 sm:gap-3 mb-7 sm:mb-9"
                    >
                        {[
                            { emoji: '🔥', label: 'Streak', value: String(streakDays), sub: 'days', bg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10' },
                            { emoji: '✅', label: 'Check-ins', value: fmtShort(totalCheckins), sub: 'total', bg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10' },
                            { emoji: '✨', label: 'Today', value: String(remainingCheckins), sub: 'slots left', bg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10' },
                        ].map((s) => (
                            <div key={s.label} className={`flex flex-col items-center gap-0.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/8 ${s.bg} hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200 backdrop-blur-sm cursor-default`}>
                                <span className="text-xl sm:text-2xl select-none">{s.emoji}</span>
                                <span className="text-base sm:text-lg font-black text-gray-800 dark:text-white leading-none">{s.value}</span>
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 tracking-wide uppercase">{s.sub}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* ── Mood & Cheer cards ── */}
                    <div className="w-full space-y-3 sm:space-y-4 mb-5">
                        {/* Mood Snapshot */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.18 }}
                            className="sp-card relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/65 dark:bg-white/[0.04] backdrop-blur-xl border border-white/90 dark:border-white/8 shadow-sm hover:shadow-xl p-4 sm:p-5 group"
                        >
                            <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-gradient-to-br from-rose-400/25 via-pink-300/15 to-transparent blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-400/30 group-hover:scale-110 transition-transform duration-300">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm sm:text-base font-extrabold text-gray-800 dark:text-white">Today's Mood</h3>
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15">Snapshot</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Your emotional check-in today</p>
                                    </div>
                                </div>

                                {todayCard ? (
                                    <div className="space-y-2.5">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-violet-50/80 dark:bg-violet-500/10 border border-violet-200/40 dark:border-violet-500/15 px-3 py-2 text-center">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500/70">Presence</p>
                                                <p className="text-lg font-black text-violet-600 dark:text-violet-400">{todayCard.presence ?? "-"}<span className="text-[10px] font-medium text-violet-400/50">/10</span></p>
                                            </div>
                                            <div className="rounded-xl bg-sky-50/80 dark:bg-sky-500/10 border border-sky-200/40 dark:border-sky-500/15 px-3 py-2 text-center">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-sky-500/70">Capacity</p>
                                                <p className="text-lg font-black text-sky-600 dark:text-sky-400">{todayCard.capacity ?? "-"}<span className="text-[10px] font-medium text-sky-400/50">/10</span></p>
                                            </div>
                                        </div>
                                        {todayCard.weather && (
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium capitalize">Weather: {todayCard.weather}</p>
                                        )}
                                        {todayCard.moods && (
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Moods: {todayCard.moods}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-rose-50/60 dark:bg-rose-500/5 border border-rose-200/30 dark:border-rose-500/10 px-4 py-4 text-center">
                                        <p className="text-2xl mb-1 select-none">💭</p>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">No check-in yet today</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">Start one and keep your streak alive!</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Cheer Boost */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.24 }}
                            className="sp-card relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/65 dark:bg-white/[0.04] backdrop-blur-xl border border-white/90 dark:border-white/8 shadow-sm hover:shadow-xl p-4 sm:p-5 group"
                        >
                            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-tl from-violet-400/25 via-blue-300/15 to-transparent blur-2xl pointer-events-none group-hover:opacity-80 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-400/30 group-hover:scale-110 transition-transform duration-300">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm sm:text-base font-extrabold text-gray-800 dark:text-white">Cheer Boost</h3>
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-violet-600 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/15">Tip</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Your daily encouragement</p>
                                    </div>
                                </div>
                                <p className="text-[13px] sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-medium">{sanitizeInput(latestInsight)}</p>
                                <div className="mt-2.5 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-yellow-50/40 dark:from-amber-900/10 dark:via-orange-900/5 dark:to-transparent border border-amber-100/60 dark:border-amber-800/20">
                                    <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                    <p className="text-[10px] text-amber-600/70 dark:text-amber-500/60 leading-snug font-semibold">Small steps count. Share how you feel, even when it's just one sentence.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Quick Adventures (Hub-style cards) ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="mb-5"
                    >
                        <div className="flex items-center gap-1.5 mb-3">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Quick Adventures</h2>
                        </div>
                        <div className="space-y-3">
                            {studentAdventures.map((opt, i) => {
                                const Icon = opt.icon;
                                const isDisabled = opt.featured && checkinLimitReached;
                                return (
                                    <motion.button
                                        key={opt.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.32 + i * 0.08 }}
                                        onClick={() => opt.featured ? onStartCheckin() : navigate(opt.path)}
                                        disabled={isDisabled}
                                        className={`sp-card w-full relative overflow-hidden rounded-2xl sm:rounded-3xl text-left bg-white/65 dark:bg-white/[0.04] backdrop-blur-xl border border-white/90 dark:border-white/8 shadow-sm hover:shadow-xl p-4 sm:p-5 group ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`absolute -top-10 -left-10 w-36 h-36 rounded-full bg-gradient-to-br ${opt.accent} blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700`} />
                                        <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-tl ${opt.accent} blur-2xl pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
                                        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
                                            <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${opt.iconBg} flex items-center justify-center shadow-lg ${opt.iconShadow} group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="text-sm sm:text-base font-extrabold text-gray-800 dark:text-white truncate">{opt.title}</h3>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${opt.tagCl}`}>{opt.tag}</span>
                                                </div>
                                                <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 leading-snug font-medium">{opt.featured && checkinLimitReached ? "Daily limit reached" : opt.desc}</p>
                                            </div>
                                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50/80 dark:bg-white/8 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-white/12 transition-all duration-200 group-hover:translate-x-0.5">
                                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* ── Recent Moments ── */}
                    {recentSnapshots?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            className="mb-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-violet-500" />
                                    <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Recent Moments</h2>
                                </div>
                                <Link to="/profile/emotional-history" className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors">View all</Link>
                            </div>
                            <div className="space-y-2">
                                {recentSnapshots.slice(0, 3).map((entry, idx) => (
                                    <motion.div
                                        key={entry.id || entry.date}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: 0.52 + idx * 0.06 }}
                                        className="rounded-xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm border border-white/80 dark:border-white/8 px-3.5 py-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-700 dark:text-white">{formatDateLabel(entry.date)}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{formatWeekdayLabel(entry.date)}</span>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${entry.aiAnalysis?.needsSupport ? "text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15" : "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15"}`}>
                                                {entry.aiAnalysis?.needsSupport ? "Support" : "Steady"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                            <span>Presence <strong className="text-gray-700 dark:text-white">{entry.presenceLevel ?? "-"}</strong></span>
                                            <span>Capacity <strong className="text-gray-700 dark:text-white">{entry.capacityLevel ?? "-"}</strong></span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Theme toggle ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.58, duration: 0.35 }}
                        className="mb-4"
                    >
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm border border-white/80 dark:border-white/8 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center shadow-sm">
                                    <Sun className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200">Theme</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Pick your preferred look</p>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                    </motion.div>

                    {/* ── Sign out ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.62, duration: 0.35 }}
                    >
                        <button
                            type="button"
                            onClick={onOpenLogout}
                            className="sp-card w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm border border-rose-200/50 dark:border-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-500/10 hover:shadow-md transition-all duration-200 text-sm font-extrabold"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </motion.div>

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-6 text-center text-[10px] text-gray-300 dark:text-gray-600 tracking-wide font-semibold"
                    >
                        Millennia World School
                    </motion.p>
                </div>
            </div>
        </>
    );
});

/* ---------------------- Main Component ---------------------- */
const ProfilePage = memo(function ProfilePage() {
    const navigate = useNavigate();
    const reduce = useReducedMotion();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const { user: currentUser } = useSelector((state) => state.auth);
    const isAdminPrincipal = useMemo(
        () => currentUser && ['admin', 'superadmin', 'head_unit', 'directorate'].includes(currentUser.role),
        [currentUser],
    );

    // Redux state
    const canAccessDashboard = currentUser && hasEmotionalDashboardAccess(currentUser);
    const dashboardRole = useMemo(() => getEmotionalDashboardRole(currentUser), [currentUser]);
    const delegatedDashboardAccess = hasDelegatedDashboardAccess(currentUser);
    const delegatedDashboardDetails = getDelegatedDashboardDetails(currentUser);
    const {
        todayCheckin,
        checkinHistory,
        personalDashboard,
        personalLoading
    } = useSelector((state) => state.checkin);

    // Local state
    const [isCompact, setIsCompact] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [checkinUsage, setCheckinUsage] = useState(() => {
        const snapshot = readCheckinUsageSnapshot();
        return { ...snapshot, ready: typeof window !== "undefined" };
    });

    // Load data on mount
    useEffect(() => {
        if (currentUser) {
            dispatch(getPersonalDashboard());
            dispatch(getCheckinHistory({ page: 1, limit: 50 }));
        }
    }, [dispatch, currentUser]);

    const handleViewportResize = useThrottledCallback(() => {
        setIsCompact(window.innerWidth < 640);
    }, 150);

    // Check for mobile compact mode
    useEffect(() => {
        handleViewportResize();
        window.addEventListener('resize', handleViewportResize);
        return () => window.removeEventListener('resize', handleViewportResize);
    }, [handleViewportResize]);

    // Processed user data
    const user = useMemo(() => {
        if (!currentUser) {
            return {
                name: "Loading...",
                email: "loading@example.com",
                initials: "L",
                completed: 0,
                rating: 0,
                department: "",
                role: "",
                position: "",
                level: ""
            };
        }

        const getUserTitle = (user) => {
            if (!user?.gender) return sanitizeInput(user?.name) || 'User';
            const title = user.gender === 'male' ? 'Mr.' : user.gender === 'female' ? 'Ms.' : '';
            const displayName = sanitizeInput(user.username || user.name || 'User');
            return title ? `${title} ${displayName}` : displayName;
        };

        const fallbackHistoryLength = Array.isArray(checkinHistory)
            ? checkinHistory.length
            : checkinHistory?.data?.checkins?.length
                || checkinHistory?.checkins?.length
                || 0;

        return {
            name: getUserTitle(currentUser),
            email: sanitizeInput(currentUser.email) || "user@example.com",
            initials: sanitizeInput(currentUser.name || currentUser.username || "U").charAt(0).toUpperCase(),
            completed: personalDashboard?.overall?.totalCheckins ?? fallbackHistoryLength,
            rating: 4.8,
            department: sanitizeInput(currentUser.unit || currentUser.department) || "Not specified",
            role: currentUser.role || "staff",
            position: sanitizeInput(currentUser.jobPosition) || "Junior Full Stack Web Developer",
            level: sanitizeInput(currentUser.jobLevel) || "Staff"
        };
    }, [currentUser, checkinHistory, personalDashboard]);

    const tier = useMemo(() => getTier(user.completed), [user.completed]);

    const remainingCheckins = checkinUsage.ready
        ? Math.max(MAX_DAILY_EMOTIONAL_CHECKINS - checkinUsage.count, 0)
        : MAX_DAILY_EMOTIONAL_CHECKINS;
    const checkinLimitReached = checkinUsage.ready && remainingCheckins === 0;
    const checkinDescription = checkinUsage.ready
        ? checkinLimitReached
            ? `Available again at ${formatResetTimeLabel(checkinUsage.nextReset)}`
            : `${remainingCheckins} check-in chance${remainingCheckins === 1 ? '' : 's'} left today`
        : "Checking quota...";

    const handleEmotionalCheckin = useCallback(() => {
        if (typeof window === "undefined") return;
        const snapshot = readCheckinUsageSnapshot();

        if (snapshot.count >= MAX_DAILY_EMOTIONAL_CHECKINS) {
            setCheckinUsage({ ...snapshot, ready: true });
            toast({
                title: "Daily limit reached",
                description: `You can try again after ${formatResetTimeLabel(snapshot.nextReset)}.`,
                variant: "destructive"
            });
            return;
        }

        const updated = { ...snapshot, count: snapshot.count + 1 };
        persistCheckinUsageSnapshot(updated);
        setCheckinUsage({ ...updated, ready: true });
        const isStudent = currentUser?.role === 'student';
        navigate(isStudent ? "/student/support-hub" : "/support-hub");
    }, [navigate, toast, currentUser]);

    // Derived info for today's check-in
    const todayCard = useMemo(() => {
        const source = personalDashboard?.today?.checkin || todayCheckin;
        if (!source) return null;
        const moodCount = Array.isArray(source.selectedMoods) ? source.selectedMoods.length : 0;
        const moods = moodCount > 0 ? source.selectedMoods.slice(0, 3).join(', ') + (moodCount > 3 ? '.' : '') : null;
        const weather = source.weatherType || null;
        const presence = typeof source.presenceLevel === 'number' ? source.presenceLevel : null;
        const capacity = typeof source.capacityLevel === 'number' ? source.capacityLevel : null;
        const id = source._id || source.id || null;
        const needsSupport = !!source.aiAnalysis?.needsSupport;
        const hasAI = !!source.aiAnalysis;
        const confidence = typeof source.aiAnalysis?.confidence === 'number' ? source.aiAnalysis.confidence : null;
        return { id, moods, weather, presence, capacity, needsSupport, hasAI, confidence, moodCount };
    }, [personalDashboard, todayCheckin]);

    const overallCard = useMemo(() => {
        if (!personalDashboard?.overall) return null;
        const overall = personalDashboard.overall;
        return {
            totalCheckins: overall.totalCheckins ?? 0,
            avgPresence: typeof overall.averages?.presence === 'number' ? overall.averages.presence : null,
            avgCapacity: typeof overall.averages?.capacity === 'number' ? overall.averages.capacity : null,
            streaks: overall.streaks || { current: 0, longest: 0 },
            moodHighlights: overall.moodHighlights || [],
            aiHighlights: overall.aiHighlights || { supportNeededDays: 0, stableDays: 0 },
            periodSummary: overall.periodSummary,
            firstCheckinDate: overall.firstCheckinDate,
            lastCheckinDate: overall.lastCheckinDate
        };
    }, [personalDashboard]);

    const insights = useMemo(() => personalDashboard?.insights || [], [personalDashboard]);
    const recentSnapshots = useMemo(() => personalDashboard?.recentCheckins || [], [personalDashboard]);

    // Animation variants
    const container = useMemo(
        () => ({
            hidden: { opacity: 0, y: 8 },
            show: {
                opacity: 1,
                y: 0,
                transition: {
                    staggerChildren: reduce ? 0 : 0.06,
                    duration: 0.4,
                    ease: "easeOut"
                }
            }
        }),
        [reduce]
    );

    const item = useMemo(() => ({
        hidden: { opacity: 0, y: 6 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.32, ease: "easeOut" }
        }
    }), []);

    // Menu configuration
    const isStudent = currentUser?.role === 'student';
    const menuItems = useMemo(() => {
        const emotionalBadge = checkinUsage.ready
            ? checkinLimitReached
                ? "Come back later"
                : `${remainingCheckins} left today`
            : "Syncing...";

        const baseItems = [
            {
                key: "emotional-checkin",
                icon: Sparkles,
                title: "Emotional Check-in",
                to: isStudent ? "/student/support-hub" : "/support-hub",
                onClick: handleEmotionalCheckin,
                disabled: checkinLimitReached,
                description: checkinDescription,
                featured: true,
                badge: emotionalBadge,
            },
            { key: "edit", icon: User, title: "Edit Profile", to: "/profile/edit" },
            { key: "notif", icon: Bell, title: "Notifications", to: "/notifications" },
        ];

        const shouldShowPersonalMenu = currentUser && !['directorate', 'admin', 'superadmin'].includes(currentUser.role);
        const isAdminMenu = currentUser && ['directorate', 'admin', 'superadmin', 'head_unit'].includes(currentUser.role);
        const dashboardMenuItem = {
            key: "dashboard",
            icon: BarChart3,
            title: dashboardRole === 'head_unit' ? "Unit Dashboard" : "Emotional Dashboard",
            to: "/emotional-checkin/dashboard",
            badge: delegatedDashboardAccess ? "Delegated" : undefined
        };

        if (isAdminMenu) {
            baseItems.splice(1, 0,
                dashboardMenuItem,
                { key: "user-mgmt", icon: UserCog, title: "User Management", to: "/user-management" }
            );
        } else {
            if (canAccessDashboard) {
                baseItems.splice(1, 0, dashboardMenuItem);
            }

            if (shouldShowPersonalMenu) {
                const insertIndex = canAccessDashboard ? 2 : 1;
                baseItems.splice(insertIndex, 0,
                    { key: "stats", icon: TrendingUp, title: "Personal Stats", to: "/profile/personal-stats" },
                    { key: "history", icon: Calendar, title: "Emotional History", to: "/profile/emotional-history" },
                    { key: "insights", icon: Activity, title: "Emotional Insights", to: "/profile/emotional-patterns" }
                );
            }
        }

        return baseItems;
    }, [currentUser, isStudent, handleEmotionalCheckin, checkinDescription, checkinLimitReached, checkinUsage.ready, remainingCheckins, canAccessDashboard, dashboardRole, delegatedDashboardAccess]);

    // Quick actions
    const quickActions = useMemo(() => {
        const isAdminRole = currentUser && ['directorate', 'admin', 'superadmin'].includes(currentUser.role);
        const isHeadUnitRole = currentUser && currentUser.role === 'head_unit';
        const dashboardLabel = dashboardRole === 'head_unit' ? "Unit Dashboard" : "Emotional Dashboard";
        const dashboardHint = delegatedDashboardAccess && delegatedDashboardDetails
            ? `Mirrors ${delegatedDashboardDetails.delegatedFromName || delegatedDashboardDetails.delegatedFromEmail}`
            : dashboardRole === 'head_unit'
                ? "Monitor team wellness"
                : "Monitor & analyze";

        if (isAdminRole) {
            return [
                { title: dashboardLabel, hint: dashboardHint, icon: BarChart3, to: "/emotional-checkin/dashboard" },
                { title: "User Management", hint: "Manage users", icon: UserCog, to: "/user-management" },
            ];
        }

        if (isHeadUnitRole) {
            return [
                { title: "Unit Dashboard", hint: "Monitor team wellness", icon: BarChart3, to: "/emotional-checkin/dashboard" },
                { title: "My Stats", hint: `${user.completed} check-ins`, icon: TrendingUp, to: "/profile/personal-stats" },
            ];
        }

        if (canAccessDashboard) {
            return [
                { title: dashboardLabel, hint: dashboardHint, icon: BarChart3, to: "/emotional-checkin/dashboard" },
                { title: "My Stats", hint: `${user.completed} check-ins`, icon: TrendingUp, to: "/profile/personal-stats" },
                { title: "Emotional History", hint: "Reflection & thoughts", icon: Calendar, to: "/profile/emotional-history" },
            ];
        }

        return [
            { title: "My Stats", hint: `${user.completed} check-ins`, icon: TrendingUp, to: "/profile/personal-stats" },
            { title: "Emotional History", hint: "Reflection & thoughts", icon: Calendar, to: "/profile/emotional-history" },
            { title: "Emotional Patterns", hint: "Insights & patterns", icon: Activity, to: "/profile/emotional-patterns" },
        ];
    }, [user.completed, currentUser, dashboardRole, delegatedDashboardAccess, delegatedDashboardDetails, canAccessDashboard]);

    // Logout handler
    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate("/");
        } catch (error) {
            console.error('Logout failed:', error);
            // Still navigate to landing page even if logout API fails
            navigate("/");
        }
    };

    const handleStudentBack = useCallback(() => {
        navigate("/student/support-hub");
    }, [navigate]);

    if (isStudent) {
        return (
            <>
                <Helmet>
                    <title>Student Profile - MWS APP</title>
                </Helmet>

                <StudentProfileView
                    currentUser={currentUser}
                    user={user}
                    todayCard={todayCard}
                    overallCard={overallCard}
                    insights={insights}
                    recentSnapshots={recentSnapshots}
                    checkinDescription={checkinDescription}
                    checkinLimitReached={checkinLimitReached}
                    remainingCheckins={remainingCheckins}
                    onBack={handleStudentBack}
                    onStartCheckin={handleEmotionalCheckin}
                    onOpenLogout={() => setShowLogoutDialog(true)}
                />

                <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <DialogContent className="sm:max-w-[425px] border-0 bg-transparent shadow-none">
                        <GlassCard variant="elevated" className="p-6 border-0 shadow-glass-lg">
                            <DialogHeader className="space-y-3">
                                <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <LogOut className="h-5 w-5 text-destructive" />
                                    Sign Out
                                </DialogTitle>
                                <DialogDescription className="text-foreground/70 leading-relaxed">
                                    Are you sure you want to sign out? You can log in again anytime.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLogoutDialog(false)}
                                    className="flex-1 border-border/60 bg-card/40 hover:bg-card/60 text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleLogout}
                                    className="flex-1 bg-destructive hover:bg-destructive/90 text-primary"
                                >
                                    Sign Out
                                </Button>
                            </DialogFooter>
                        </GlassCard>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Profile — MWS APP</title>
            </Helmet>

            <div className="relative min-h-dvh w-full overflow-hidden">
                {/* Decorative Elements */}
                <GridPattern />
                <DecorativeBlob className="bg-primary/10 -top-20 -right-20 w-80 h-80" delay={0} />
                <DecorativeBlob className="bg-gold/8 -bottom-32 -left-32 w-96 h-96" delay={2} />

                <motion.main
                    initial="hidden"
                    animate="show"
                    variants={container}
                    className="relative z-10 px-4 pb-12 pt-6"
                >
                    <div className={`mx-auto ${isCompact ? 'max-w-sm' : 'max-w-md'}`}>
                        {/* Header */}
                        <motion.header variants={item} className="mb-6 flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                aria-label="Go back"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-glass-sm"
                    >
                        <ArrowLeft className="h-5 w-5 text-foreground/80" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-semibold text-foreground">{getDynamicGreeting(currentUser, user.name)}</h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">{getDynamicSubGreeting()}</p>
                    </div>

                    {isAdminPrincipal && (
                        <button
                            onClick={() => navigate("/mtss")}
                            className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition"
                        >
                            Back to MTSS
                        </button>
                    )}
                </motion.header>

                        {/* Today's Check-in */}
                        <motion.section variants={item}>
                            <GlassCard>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-semibold text-foreground">Today's Check-in</h2>
                                        {todayCard ? (
                                            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                {todayCard.presence !== null && (
                                                    <div>
                                                        <span className="text-foreground/80">Presence:</span> {todayCard.presence}
                                                    </div>
                                                )}
                                                {todayCard.capacity !== null && (
                                                    <div>
                                                        <span className="text-foreground/80">Capacity:</span> {todayCard.capacity}
                                                    </div>
                                                )}
                                                {todayCard.weather && (
                                                    <div className="col-span-2 truncate">
                                                        <span className="text-foreground/80">Weather:</span> {todayCard.weather}
                                                    </div>
                                                )}
                                                {todayCard.moods && todayCard.moodCount > 0 && (
                                                    <div className="col-span-2 truncate">
                                                        <span className="text-foreground/80">Moods:</span> {todayCard.moods}
                                                    </div>
                                                )}
                                                {todayCard.hasAI && (
                                                    <div className="col-span-2 mt-1 flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${todayCard.needsSupport ? 'bg-rose-500/10 text-rose-400 ring-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'}`}>
                                                            {todayCard.needsSupport ? 'AI: Needs Support' : 'AI: Stable'}
                                                        </span>
                                                        {todayCard.confidence !== null && (
                                                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 bg-secondary/10 text-foreground/80 ring-border/30">
                                                                Confidence: {Math.round(todayCard.confidence)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-xs text-muted-foreground">No check-in recorded today.</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {todayCard && todayCard.id ? (
                                            <Link to={`/emotional-checkin/rate/${todayCard.id}`} className="inline-flex items-center gap-2 rounded-md border border-border/50 px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors">
                                                View Details <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        ) : null}
                                        {todayCard ? (
                                            <Link to="/profile/emotional-history" className="inline-flex items-center gap-2 rounded-md border border-border/50 px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors">
                                                View History <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        ) : (
                                            <Link to={currentUser?.role === 'student' ? '/student/emotional-checkin' : (currentUser?.role === 'staff' || currentUser?.role === 'teacher') ? '/emotional-checkin/staff' : '/emotional-checkin'} className="inline-flex items-center gap-2 rounded-md border border-border/50 px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors">
                                                Start Check-in <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        )}
                                        <Link to="/profile/personal-stats" className="inline-flex items-center gap-2 rounded-md border border-border/50 px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors">
                                            Overall Stats <ChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.section>

                        {/* Profile Card */}
                        <motion.section variants={item}>
                            <GlassCard variant="elevated">
                                <div className="flex items-start gap-4">
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary via-gold to-emerald text-2xl font-semibold text-primary-foreground ring-2 ring-primary/20 shadow-lg">
                                        {user.initials}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-base font-semibold text-foreground truncate">{user.name}</p>
                                            <tier.icon className={`h-4 w-4 ${tier.color}`} />
                                        </div>

                                        <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>

                                        <div className="flex items-center gap-2 text-xs text-foreground/70 mb-3">
                                            <User className="h-3 w-3" />
                                            <span>{user.department} • {user.level} • {user.position}</span>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/20 px-2.5 py-1 border border-border/50">
                                                <Star className="h-4 w-4 text-gold" />
                                                <span className="text-sm font-medium text-foreground">{user.rating}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/20 px-2.5 py-1 border border-border/50">
                                                <CheckCircle className="h-4 w-4 text-emerald" />
                                                <span className="text-xs text-foreground/80">{fmtShort(user.completed)} Check-ins</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.section>

                        {/* Menu */}
                        <motion.nav variants={item} className={`mt-6 space-y-3 ${isCompact ? 'space-y-2' : ''}`} aria-label="Profile menu">
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.key}
                                    icon={item.icon}
                                    title={item.title}
                                    to={item.to}
                                    compact={isCompact}
                                    onClick={item.onClick}
                                    disabled={item.disabled}
                                    description={item.description}
                                    featured={item.featured}
                                    badge={item.badge}
                                />
                            ))}
                        </motion.nav>

                        {personalLoading && !overallCard && (
                            <motion.section variants={item} className="mt-4">
                                <GlassCard>
                                    <p className="text-xs text-muted-foreground">Memuat ringkasan personal...</p>
                                </GlassCard>
                            </motion.section>
                        )}

                        {overallCard && (
                            <motion.section variants={item} className="mt-4">
                                <GlassCard>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h2 className="text-sm font-semibold text-foreground">Overall Snapshot</h2>
                                            <p className="text-xs text-muted-foreground">
                                                {overallCard.firstCheckinDate
                                                    ? `Tracking since ${formatDateLabel(overallCard.firstCheckinDate, { month: 'short', year: 'numeric' })}`
                                                    : 'Mulai check-in rutin agar AI belajar pola emosimu'}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-secondary/30 px-3 py-1 text-[11px] font-medium text-foreground/80">
                                            {overallCard.totalCheckins} check-ins
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                                        <div className="rounded-xl border border-border/60 bg-card/40 px-3 py-2">
                                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <IconContainer size="sm" variant="accent">
                                                    <Gauge className="h-3.5 w-3.5" />
                                                </IconContainer>
                                                Presence
                                            </div>
                                            <p className="mt-1 text-lg font-semibold text-foreground">
                                                {formatMetricValue(overallCard.avgPresence)}
                                                <span className="text-xs text-muted-foreground"> /10</span>
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-card/40 px-3 py-2">
                                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <IconContainer size="sm" variant="accent">
                                                    <Gauge className="h-3.5 w-3.5" />
                                                </IconContainer>
                                                Capacity
                                            </div>
                                            <p className="mt-1 text-lg font-semibold text-foreground">
                                                {formatMetricValue(overallCard.avgCapacity)}
                                                <span className="text-xs text-muted-foreground"> /10</span>
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-card/40 px-3 py-2 sm:col-span-1 col-span-2">
                                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <IconContainer size="sm" variant="accent">
                                                    <Flame className="h-3.5 w-3.5" />
                                                </IconContainer>
                                                Streak
                                            </div>
                                            <p className="mt-1 text-lg font-semibold text-foreground">
                                                {overallCard.streaks?.current || 0} days
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">Longest {overallCard.streaks?.longest || 0} days</p>
                                        </div>
                                    </div>

                                    {overallCard.moodHighlights?.length > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <IconContainer size="sm" variant="muted">
                                                    <PieChart className="h-3.5 w-3.5" />
                                                </IconContainer>
                                                Top moods
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {overallCard.moodHighlights.slice(0, 3).map((mood) => (
                                                    <span key={mood.mood} className="rounded-full bg-secondary/30 px-3 py-1 text-[11px] font-medium text-foreground/80">
                                                        {sanitizeInput(mood.mood)} · {mood.percentage}%
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                                        <div className="rounded-xl border border-border/60 bg-card/40 p-3">
                                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <IconContainer size="sm" variant="accent">
                                                    <Shield className="h-3.5 w-3.5" />
                                                </IconContainer>
                                                AI highlights
                                            </div>
                                            <p className="mt-2 text-sm text-foreground">
                                                Support days: <span className="font-semibold">{overallCard.aiHighlights.supportNeededDays}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">Stable days: {overallCard.aiHighlights.stableDays}</p>
                                        </div>
                                        {overallCard.periodSummary?.count > 0 && (
                                            <div className="rounded-xl border border-border/60 bg-card/40 p-3">
                                                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    <IconContainer size="sm" variant="accent">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                    </IconContainer>
                                                    30 day trends
                                                </div>
                                                <p className="mt-2 text-sm text-foreground">
                                                    Avg presence: <span className="font-semibold">{formatMetricValue(overallCard.periodSummary.averagePresence)}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Positive {overallCard.periodSummary.positiveDays} · Challenging {overallCard.periodSummary.challengingDays}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.section>
                        )}

                        {insights.length > 0 && (
                            <motion.section variants={item} className="mt-4">
                                <GlassCard>
                                    <div className="flex items-center gap-3">
                                        <IconContainer variant="accent">
                                            <Sparkles className="h-4 w-4" />
                                        </IconContainer>
                                        <div>
                                            <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
                                            <p className="text-xs text-muted-foreground">Rekomendasi singkat untukmu</p>
                                        </div>
                                    </div>
                                    <ul className="mt-4 space-y-2 text-xs">
                                        {insights.map((insight, index) => (
                                            <li key={`${index}-${insight}`} className="flex gap-3">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                                                <span className="text-foreground">{sanitizeInput(insight)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </GlassCard>
                            </motion.section>
                        )}

                        {recentSnapshots.length > 0 && (
                            <motion.section variants={item} className="mt-4">
                                <GlassCard>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-semibold text-foreground">Recent Check-ins</h2>
                                            <p className="text-xs text-muted-foreground">Ringkasan 5 aktivitas terakhir</p>
                                        </div>
                                        <Link to="/profile/emotional-history" className="text-xs font-semibold text-primary hover:underline">
                                            View all
                                        </Link>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {recentSnapshots.map((entry) => (
                                            <div key={entry.id || entry.date} className="rounded-xl border border-border/60 bg-card/30 px-3 py-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div>
                                                        <p className="text-foreground font-medium">{formatWeekdayLabel(entry.date)}</p>
                                                        <p className="text-muted-foreground">{formatDateLabel(entry.date)}</p>
                                                    </div>
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${entry.aiAnalysis?.needsSupport ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {entry.aiAnalysis?.needsSupport ? 'Needs support' : 'Stable'}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                                                    <div><span className="text-foreground/80">Presence</span>: {entry.presenceLevel ?? '–'}</div>
                                                    <div><span className="text-foreground/80">Capacity</span>: {entry.capacityLevel ?? '–'}</div>
                                                    {entry.selectedMoods?.length > 0 && (
                                                        <div className="col-span-2 truncate">
                                                            <span className="text-foreground/80">Moods</span>: {entry.selectedMoods.slice(0, 3).map((mood) => sanitizeInput(mood)).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </motion.section>
                        )}

                        {/* Theme Section */}
                        <motion.section variants={item} className="mt-6">
                            <GlassCard>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <IconContainer variant="accent">
                                            <Heart className="h-4 w-4" />
                                        </IconContainer>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Theme</p>
                                            <p className="text-xs text-muted-foreground">Choose light or dark mode</p>
                                        </div>
                                    </div>
                                    <ThemeToggle />
                                </div>
                            </GlassCard>
                        </motion.section>

                        {/* Quick Actions */}
                        <motion.div variants={item} className={`mt-6 grid gap-3 ${isCompact ? 'gap-2' : ''}`}>
                            {quickActions.map((action) => (
                                <ActionCard
                                    key={action.title}
                                    icon={action.icon}
                                    label={action.title}
                                    hint={action.hint}
                                    to={action.to}
                                    compact={isCompact}
                                />
                            ))}
                        </motion.div>

                        {/* Logout */}
                        <motion.div variants={item} className="mt-6">
                            <button
                                type="button"
                                onClick={() => setShowLogoutDialog(true)}
                                className="w-full rounded-xl bg-destructive/90 px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-sm transition-all duration-300 hover:bg-destructive hover:shadow-glass-sm focus:ring-2 focus:ring-destructive/50"
                            >
                                <span className="inline-flex items-center gap-2 justify-center">
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </span>
                            </button>
                        </motion.div>

                        {/* Footer */}
                        <motion.footer variants={item} className="mt-6 text-center text-xs text-muted-foreground">
                            MWS APP • © {new Date().getFullYear()}
                        </motion.footer>
                    </div>
                </motion.main>
            </div>

            {/* Logout Confirmation Dialog */}
            <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <DialogContent className="sm:max-w-[425px] border-0 bg-transparent shadow-none">
                    <GlassCard variant="elevated" className="p-6 border-0 shadow-glass-lg">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <LogOut className="h-5 w-5 text-destructive" />
                                Sign Out
                            </DialogTitle>
                            <DialogDescription className="text-foreground/70 leading-relaxed">
                                Are you sure you want to sign out of MWS APP? You'll need to sign in again to access your account.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowLogoutDialog(false)}
                                className="flex-1 border-border/60 bg-card/40 hover:bg-card/60 text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                                className="flex-1 bg-destructive hover:bg-destructive/90 text-primary"
                            >
                                Sign Out
                            </Button>
                        </DialogFooter>
                    </GlassCard>
                </DialogContent>
            </Dialog>
        </>
    );
});

ProfilePage.displayName = 'ProfilePage';

export default ProfilePage;
