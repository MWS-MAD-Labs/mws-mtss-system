const toSafeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatScore = (value, unit = "") => {
    if (value === null || value === undefined || value === "") return "-";
    return `${value}${unit ? ` ${unit}` : ""}`;
};

const toProgressPercent = (current, target) => {
    const currentValue = toSafeNumber(current);
    const targetValue = toSafeNumber(target);
    if (currentValue === null || targetValue === null || targetValue <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((currentValue / targetValue) * 100)));
};

const buildFallbackChart = (current, target) => {
    const currentValue = toSafeNumber(current) ?? 0;
    const targetValue = toSafeNumber(target) ?? Math.max(currentValue, 100);
    return [
        { label: "Start", value: 0 },
        { label: "Current", value: currentValue },
        { label: "Target", value: targetValue },
    ];
};

const resolveTone = (progressPercent) => {
    if (progressPercent === null) {
        return {
            badge: "from-slate-500 to-slate-600",
            hero: "from-slate-50 via-violet-50 to-indigo-100 dark:from-slate-900/70 dark:via-violet-900/20 dark:to-indigo-900/25",
            line: ["#4f46e5", "#7c3aed"],
            helper: "Building your baseline",
        };
    }
    if (progressPercent >= 75) {
        return {
            badge: "from-emerald-500 to-teal-500",
            hero: "from-emerald-50 via-cyan-50 to-sky-100 dark:from-emerald-900/25 dark:via-cyan-900/20 dark:to-sky-900/25",
            line: ["#047857", "#0369a1"],
            helper: "Great momentum",
        };
    }
    if (progressPercent >= 40) {
        return {
            badge: "from-amber-500 to-orange-500",
            hero: "from-amber-50 via-orange-50 to-rose-100 dark:from-amber-900/25 dark:via-orange-900/20 dark:to-rose-900/25",
            line: ["#b45309", "#be185d"],
            helper: "Steady growth",
        };
    }
    return {
        badge: "from-rose-500 to-pink-500",
        hero: "from-rose-50 via-pink-50 to-violet-100 dark:from-rose-900/25 dark:via-pink-900/20 dark:to-violet-900/25",
        line: ["#be123c", "#7c3aed"],
        helper: "Small wins count",
    };
};

const roundMetric = (value) => {
    if (!Number.isFinite(value)) return null;
    if (Math.abs(value) >= 100) return Math.round(value);
    return Math.round(value * 10) / 10;
};

const buildTrendSeries = (chart = [], target = null) => {
    const safeChart = Array.isArray(chart) ? chart : [];
    const normalized = safeChart
        .map((point, index) => {
            const value = toSafeNumber(point?.value ?? point?.reading);
            if (value === null) return null;
            return {
                index,
                label: point?.label || point?.date || `Point ${index + 1}`,
                value,
            };
        })
        .filter(Boolean);

    if (!normalized.length) {
        return {
            points: "",
            areaPoints: "",
            coordinates: [],
            labels: [],
            yAxis: [0, 50, 100],
            baselineValue: null,
            latestValue: null,
            deltaValue: null,
        };
    }

    const targetValue = toSafeNumber(target);
    const allValues = normalized.map((point) => point.value);
    if (targetValue !== null) {
        allValues.push(targetValue);
    }

    const minRaw = Math.min(...allValues);
    const maxRaw = Math.max(...allValues);
    const span = Math.max(1, maxRaw - minRaw);
    const padding = span * 0.15;
    const minDomain = Math.max(0, minRaw - padding);
    const maxDomain = maxRaw + padding;
    const domainRange = Math.max(1, maxDomain - minDomain);

    const calcX = (index) => ((index / Math.max(1, normalized.length - 1)) * 560) + 20;
    const calcY = (value) => 190 - (((value - minDomain) / domainRange) * 170);

    const linePoints = normalized.map((point, index) => `${calcX(index)},${calcY(point.value)}`);
    const coordinates = normalized.map((point, index) => ({
        x: calcX(index),
        y: calcY(point.value),
        label: point.label,
        value: point.value,
    }));
    const areaPoints = [
        `${calcX(0)},190`,
        ...linePoints,
        `${calcX(normalized.length - 1)},190`,
    ];

    const yAxis = [maxDomain, (maxDomain + minDomain) / 2, minDomain].map(roundMetric);

    const baselineValue = normalized[0]?.value ?? null;
    const latestValue = normalized[normalized.length - 1]?.value ?? null;
    const deltaValue = (baselineValue !== null && latestValue !== null)
        ? roundMetric(latestValue - baselineValue)
        : null;

    return {
        points: linePoints.join(" "),
        areaPoints: areaPoints.join(" "),
        coordinates,
        labels: normalized.map((point) => point.label),
        yAxis,
        baselineValue,
        latestValue,
        deltaValue,
    };
};

export {
    formatScore,
    toProgressPercent,
    buildFallbackChart,
    resolveTone,
    toSafeNumber,
    buildTrendSeries,
};
