import { INTERVENTION_TYPES, TYPE_LOOKUP, TIER_LABELS, TIER_PRIORITY, STATUS_LABELS } from "./interventionConstants";
import { normalizeTierCode, normalizeStatus, resolveTypeKey } from "./interventionNormalize";

export const ensureStudentInterventions = (entries = []) => {
    const map = new Map();
    if (Array.isArray(entries)) {
        entries.forEach((entry) => {
            const typeKey = entry?.type?.toString().toUpperCase();
            if (typeKey && TYPE_LOOKUP.has(typeKey)) {
                map.set(typeKey, entry);
            }
        });
    }

    return INTERVENTION_TYPES.map((meta) => {
        const payload = map.get(meta.key) || {};
        const tierCode = payload.tierCode ? normalizeTierCode(payload.tierCode) : normalizeTierCode(payload.tier);
        const hasData = Boolean(
            payload.type ||
            payload.tier ||
            payload.tierCode ||
            payload.status === "active" ||
            payload.hasData,
        );
        return {
            type: meta.key,
            label: meta.label,
            accent: meta.accent,
            tierCode,
            tier: TIER_LABELS[tierCode],
            status: normalizeStatus(payload.status),
            strategies: Array.isArray(payload.strategies) ? payload.strategies.filter(Boolean) : [],
            notes: payload.notes || "",
            updatedAt: payload.updatedAt,
            updatedBy: payload.updatedBy,
            history: Array.isArray(payload.history) ? payload.history : [],
            hasData,
        };
    });
};

export const getActiveInterventions = (interventions = []) =>
    interventions.filter(
        (entry) => entry.hasData || entry.tierCode === "tier2" || entry.tierCode === "tier3",
    );

export const pickPrimaryIntervention = (interventions = []) => {
    if (!interventions.length) return null;
    const escalated = interventions
        .filter((entry) => entry.tierCode !== "tier1")
        .sort((a, b) => TIER_PRIORITY[b.tierCode] - TIER_PRIORITY[a.tierCode]);
    if (escalated.length) return escalated[0];
    return interventions[0];
};

export const pickMostCriticalIntervention = (interventions = [], profile = {}) => {
    if (!interventions.length) return null;

    const escalated = interventions.filter(
        (entry) => entry.hasData && (entry.tierCode === "tier2" || entry.tierCode === "tier3"),
    );

    if (!escalated.length) {
        return null;
    }

    const sorted = escalated.sort((a, b) => {
        const tierDiff = TIER_PRIORITY[b.tierCode] - TIER_PRIORITY[a.tierCode];
        if (tierDiff !== 0) return tierDiff;

        const aValue = a.currentValue ?? profile?.current ?? 100;
        const bValue = b.currentValue ?? profile?.current ?? 100;
        return aValue - bValue;
    });

    return sorted[0];
};

export const getMostCriticalForDisplay = (interventions = [], profile = {}, fallback = {}) => {
    const critical = pickMostCriticalIntervention(interventions, profile);
    const fallbackTier = fallback?.tier || profile?.tier || "";
    const fallbackType = fallback?.type || profile?.type || "";
    const fallbackTierCode = normalizeTierCode(fallbackTier);
    const fallbackTypeKey = resolveTypeKey(fallbackType);
    const hasFallback = fallbackTierCode !== "tier1" && (fallbackTypeKey || fallbackType);

    const fallbackResult = hasFallback
        ? (() => {
              const meta = fallbackTypeKey ? TYPE_LOOKUP.get(fallbackTypeKey) : null;
              const label = meta?.label || fallbackType || "Focused Support";
              return {
                  mode: "focused",
                  intervention: {
                      type: fallbackTypeKey || "SEL",
                      label,
                      tierCode: fallbackTierCode,
                      tier: TIER_LABELS[fallbackTierCode],
                  },
                  tier: TIER_LABELS[fallbackTierCode],
                  tierCode: fallbackTierCode,
                  label,
                  strategy: fallback?.profile?.strategy || profile?.strategy || null,
              };
          })()
        : null;

    if (critical) {
        if (fallbackResult) {
            const criticalScore = TIER_PRIORITY[critical.tierCode] || 0;
            const fallbackScore = TIER_PRIORITY[fallbackTierCode] || 0;
            if (fallbackScore > criticalScore) {
                return fallbackResult;
            }
        }
        return {
            mode: "focused",
            intervention: critical,
            tier: critical.tier,
            tierCode: critical.tierCode,
            label: critical.label,
            strategy: critical.strategies?.[0] || null,
        };
    }

    if (fallbackResult) {
        return fallbackResult;
    }

    return {
        mode: "universal",
        intervention: null,
        tier: "Tier 1",
        tierCode: "tier1",
        label: "Universal",
    };
};

export const getStatusLabel = (status) => STATUS_LABELS[status] || STATUS_LABELS.monitoring;
