const INTERVENTION_DURATION_PRESETS = Object.freeze([
    '2 weeks',
    '4 weeks',
    '6 weeks',
    '8 weeks',
    '10 weeks',
    '12 weeks',
    '16 weeks',
    '20 weeks',
    '24 weeks',
    'Custom'
]);

const DURATION_PRESET_SET = new Set(INTERVENTION_DURATION_PRESETS);

const normalizeInterventionDuration = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (DURATION_PRESET_SET.has(trimmed)) return trimmed;

    const match = trimmed.match(/^(\d{1,3})\s+days?$/i);
    if (!match) return null;
    const days = Number(match[1]);
    if (!Number.isInteger(days) || days < 1 || days > 365) return null;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
};

const getFiniteNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const calculateDirectionalProgress = ({ baseline, target, current, previous } = {}) => {
    const baselineValue = getFiniteNumber(baseline);
    const targetValue = getFiniteNumber(target);
    const currentValue = getFiniteNumber(current);
    const previousValue = getFiniteNumber(previous);

    let percentage = 0;
    if (baselineValue !== null && targetValue !== null && currentValue !== null) {
        const direction = Math.sign(targetValue - baselineValue);
        if (direction === 0) {
            percentage = currentValue === targetValue ? 100 : 0;
        } else {
            percentage = Math.round(((currentValue - baselineValue) / (targetValue - baselineValue)) * 100);
            percentage = Math.max(0, Math.min(100, percentage));
        }
    } else if (targetValue !== null && currentValue !== null && targetValue !== 0) {
        percentage = Math.max(0, Math.min(100, Math.round((currentValue / targetValue) * 100)));
    }

    let trend = 'stable';
    if (previousValue !== null && currentValue !== null && previousValue !== currentValue) {
        const desiredDirection = baselineValue !== null && targetValue !== null
            ? Math.sign(targetValue - baselineValue)
            : 1;
        trend = Math.sign(currentValue - previousValue) === desiredDirection ? 'improving' : 'declining';
    }

    return { percentage, trend };
};

module.exports = {
    INTERVENTION_DURATION_PRESETS,
    normalizeInterventionDuration,
    calculateDirectionalProgress
};
