import { Heart, BookOpen, Calculator, ShieldCheck, CalendarDays, Languages } from "lucide-react";

// Intervention type configurations with vibrant colors
export const INTERVENTION_CONFIG = {
    SEL: {
        icon: Heart,
        emoji: "\uD83D\uDC96",
        gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
        lightBg: "bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/30",
        cardBg: "bg-gradient-to-br from-purple-100/80 to-fuchsia-100/60 dark:from-purple-900/40 dark:to-fuchsia-900/30",
        border: "border-purple-200/60 dark:border-purple-700/40",
        text: "text-purple-700 dark:text-purple-300",
        ring: "ring-purple-400/30",
        glow: "shadow-purple-500/20",
        chartColor: "#a855f7"
    },
    ENGLISH: {
        icon: BookOpen,
        emoji: "\uD83D\uDCDA",
        gradient: "from-blue-500 via-cyan-500 to-teal-500",
        lightBg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30",
        cardBg: "bg-gradient-to-br from-blue-100/80 to-cyan-100/60 dark:from-blue-900/40 dark:to-cyan-900/30",
        border: "border-blue-200/60 dark:border-blue-700/40",
        text: "text-blue-700 dark:text-blue-300",
        ring: "ring-blue-400/30",
        glow: "shadow-blue-500/20",
        chartColor: "#3b82f6"
    },
    MATH: {
        icon: Calculator,
        emoji: "\uD83D\uDD22",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        lightBg: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30",
        cardBg: "bg-gradient-to-br from-emerald-100/80 to-green-100/60 dark:from-emerald-900/40 dark:to-green-900/30",
        border: "border-emerald-200/60 dark:border-emerald-700/40",
        text: "text-emerald-700 dark:text-emerald-300",
        ring: "ring-emerald-400/30",
        glow: "shadow-emerald-500/20",
        chartColor: "#10b981"
    },
    BEHAVIOR: {
        icon: ShieldCheck,
        emoji: "\u2B50",
        gradient: "from-amber-500 via-orange-500 to-yellow-500",
        lightBg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30",
        cardBg: "bg-gradient-to-br from-amber-100/80 to-orange-100/60 dark:from-amber-900/40 dark:to-orange-900/30",
        border: "border-amber-200/60 dark:border-amber-700/40",
        text: "text-amber-700 dark:text-amber-300",
        ring: "ring-amber-400/30",
        glow: "shadow-amber-500/20",
        chartColor: "#f59e0b"
    },
    ATTENDANCE: {
        icon: CalendarDays,
        emoji: "\uD83D\uDCDD",
        gradient: "from-indigo-500 via-violet-500 to-purple-500",
        lightBg: "bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30",
        cardBg: "bg-gradient-to-br from-indigo-100/80 to-violet-100/60 dark:from-indigo-900/40 dark:to-violet-900/30",
        border: "border-indigo-200/60 dark:border-indigo-700/40",
        text: "text-indigo-700 dark:text-indigo-300",
        ring: "ring-indigo-400/30",
        glow: "shadow-indigo-500/20",
        chartColor: "#6366f1"
    },
    INDONESIAN: {
        icon: Languages,
        emoji: "\uD83C\uDDEE\uD83C\uDDE9",
        gradient: "from-rose-500 via-red-500 to-pink-500",
        lightBg: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/30",
        cardBg: "bg-gradient-to-br from-rose-100/80 to-red-100/60 dark:from-rose-900/40 dark:to-red-900/30",
        border: "border-rose-200/60 dark:border-rose-700/40",
        text: "text-rose-700 dark:text-rose-300",
        ring: "ring-rose-400/30",
        glow: "shadow-rose-500/20",
        chartColor: "#e11d48"
    }
};

// Tier configurations
export const TIER_CONFIG = {
    tier1: {
        label: "Tier 1",
        bg: "bg-emerald-500",
        gradient: "from-emerald-500 to-teal-500",
        text: "text-emerald-700 dark:text-emerald-300",
        lightBg: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    tier2: {
        label: "Tier 2",
        bg: "bg-amber-500",
        gradient: "from-amber-500 to-orange-500",
        text: "text-amber-700 dark:text-amber-300",
        lightBg: "bg-amber-100 dark:bg-amber-900/30"
    },
    tier3: {
        label: "Tier 3",
        bg: "bg-rose-500",
        gradient: "from-rose-500 to-pink-500",
        text: "text-rose-700 dark:text-rose-300",
        lightBg: "bg-rose-100 dark:bg-rose-900/30"
    }
};

// Glass morphism styles
export const glassStyles = {
    card: "backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-white/10",
    inner: "backdrop-blur-md bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/5",
    hover: "hover:bg-white/70 dark:hover:bg-slate-900/60 hover:shadow-xl transition-all duration-300"
};

// Helper to get tier badge style
export const getTierBadgeStyle = (tier) => {
    switch (tier) {
        case 'tier3':
            return 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/30';
        case 'tier2':
            return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30';
        default:
            return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-500/20';
    }
};

// Helper to get status badge style
export const getStatusBadgeStyle = (status) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-emerald-500/20';
        case 'paused':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-amber-500/20';
        default:
            return 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 ring-slate-500/20';
    }
};

// Helper to get status label
export const getStatusLabel = (status) => {
    switch (status) {
        case 'active': return 'Active';
        case 'paused': return 'Paused';
        case 'closed': return 'Closed';
        default: return 'Monitoring';
    }
};
