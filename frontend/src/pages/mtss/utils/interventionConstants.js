export const TIER_LABELS = {
    tier1: "Tier 1",
    tier2: "Tier 2",
    tier3: "Tier 3",
};

export const INTERVENTION_TYPES = [
    { key: "SEL", label: "SEL", accent: "from-[#fecdd3]/95 to-[#fda4af]/90 text-rose-900 dark:from-[#831843]/45 dark:to-[#be123c]/35 dark:text-rose-100" },
    { key: "ENGLISH", label: "English", accent: "from-[#dbeafe]/95 to-[#93c5fd]/90 text-sky-900 dark:from-[#1e3a8a]/45 dark:to-[#0369a1]/35 dark:text-sky-100" },
    { key: "MATH", label: "Math", accent: "from-[#dcfce7]/95 to-[#86efac]/90 text-emerald-900 dark:from-[#14532d]/45 dark:to-[#047857]/35 dark:text-emerald-100" },
    { key: "BEHAVIOR", label: "Behavior", accent: "from-[#ffedd5]/95 to-[#fdba74]/90 text-amber-900 dark:from-[#78350f]/45 dark:to-[#b45309]/35 dark:text-amber-100" },
    { key: "ATTENDANCE", label: "Attendance", accent: "from-[#ede9fe]/95 to-[#c4b5fd]/90 text-indigo-900 dark:from-[#312e81]/45 dark:to-[#4f46e5]/35 dark:text-indigo-100" },
    { key: "INDONESIAN", label: "Bahasa Indonesia", accent: "from-[#ffe4e6]/95 to-[#fb7185]/90 text-rose-900 dark:from-[#881337]/45 dark:to-[#be123c]/35 dark:text-rose-100" },
];

export const TYPE_LOOKUP = new Map(INTERVENTION_TYPES.map((type) => [type.key, type]));

export const TIER_PRIORITY = { tier1: 1, tier2: 2, tier3: 3 };

export const STATUS_LABELS = {
    monitoring: "Monitoring",
    active: "Active",
    paused: "Paused",
    closed: "Closed",
};

export const FOCUS_TYPE_MATCHERS = [
    { key: "ATTENDANCE", pattern: /attendance|absen|present|presence/i },
    { key: "BEHAVIOR", pattern: /behavior|behaviour|conduct|discipline/i },
    { key: "MATH", pattern: /math|mathematics|numeracy|algebra|geometry/i },
    { key: "ENGLISH", pattern: /english|bahasa inggris|ela|literacy|reading|writing|fluency/i },
    { key: "INDONESIAN", pattern: /indonesian|bahasa indonesia|\bbahasa\b|\bbi\b/i },
    { key: "SEL", pattern: /sel|social|emotional|wellbeing|well-being/i },
];

export const tierToneClasses = {
    tier1: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/18 dark:text-emerald-100 dark:border-emerald-400/40",
    tier2: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/18 dark:text-amber-100 dark:border-amber-400/40",
    tier3: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/18 dark:text-rose-100 dark:border-rose-400/40",
};
