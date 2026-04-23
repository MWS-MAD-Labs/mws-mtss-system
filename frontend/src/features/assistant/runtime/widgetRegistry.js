export const ASSISTANT_WIDGET_TYPES = Object.freeze({
    STATS: 'stats',
    BAR_CHART: 'bar_chart',
    TABLE: 'table',
    TIMELINE: 'timeline',
    CHECKLIST: 'checklist',
    CAPABILITIES: 'capabilities',
    ACTION_CHIPS: 'action_chips',
    SKILL_CARDS: 'skill_cards'
});

const SUPPORTED_TYPES = new Set(Object.values(ASSISTANT_WIDGET_TYPES));

export const isWidgetTypeSupported = (type = '') => SUPPORTED_TYPES.has(String(type || '').trim().toLowerCase());
