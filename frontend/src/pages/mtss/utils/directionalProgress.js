const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const getDirectionalProgress = ({ baseline, current, target }) => {
    const baselineValue = toNumber(baseline);
    const currentValue = toNumber(current);
    const targetValue = toNumber(target);

    if (currentValue == null || targetValue == null) {
        return { percent: null, gap: null, targetMet: false };
    }

    const direction = baselineValue != null && targetValue < baselineValue ? -1 : 1;
    const targetMet = direction === 1 ? currentValue >= targetValue : currentValue <= targetValue;
    const gap = Math.max(0, direction * (targetValue - currentValue));

    if (baselineValue == null || baselineValue === targetValue) {
        return { percent: targetMet ? 100 : 0, gap, targetMet };
    }

    const percent = Math.max(0, Math.min(100, Math.round(
        ((currentValue - baselineValue) / (targetValue - baselineValue)) * 100,
    )));

    return { percent, gap, targetMet };
};

export const isDirectionalTargetMet = (baseline, current, target) =>
    getDirectionalProgress({ baseline, current, target }).targetMet;
