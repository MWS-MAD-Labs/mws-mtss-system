import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ASSISTANT_WIDGET_TYPES, isWidgetTypeSupported } from '@/features/assistant/runtime/widgetRegistry';

const LazyChatBarChartWidget = lazy(() => import('@/features/assistant/chat/widgets/ChatBarChartWidget'));
const LazyMarkdownRenderer = lazy(() => import('@/features/assistant/chat/widgets/MarkdownRenderer'));

const preprocessMarkdownContent = (content = '') =>
    String(content || '')
        .replace(/&lt;br\s*\/?&gt;/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\+\+([^\n+][\s\S]*?)\+\+/g, '<u>$1</u>');

const normalizeRichText = (value = '') =>
    String(value || '')
        .replace(/&lt;br\s*\/?&gt;/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

const normalizeIconToken = (value = '', fallback = '*') => {
    const token = String(value || '').trim();
    if (!token) return fallback;
    if (/[Ãâð]/.test(token)) return fallback;
    return token;
};

const formatWidgetValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number' && Number.isFinite(value)) return Intl.NumberFormat('en-US').format(value);
    return normalizeRichText(value);
};

const ChartWidgetFallback = React.memo(({ widget }) => (
    <div className="rounded-2xl border border-cyan-200/55 dark:border-cyan-300/20 bg-gradient-to-br from-cyan-50/80 via-sky-50/70 to-indigo-50/70 dark:from-cyan-500/8 dark:via-sky-500/6 dark:to-indigo-500/8 p-3 mt-3 animate-pulse">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
            {widget?.title || 'Chart'}
        </p>
        {widget?.subtitle && (
            <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">{widget.subtitle}</p>
        )}
        <div className="h-40 mt-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/25" />
    </div>
));
ChartWidgetFallback.displayName = 'ChartWidgetFallback';

const ChartWidget = React.memo(({ widget }) => (
    <Suspense fallback={<ChartWidgetFallback widget={widget} />}>
        <LazyChatBarChartWidget widget={widget} />
    </Suspense>
));
ChartWidget.displayName = 'ChartWidget';

const splitFocusTokens = (value = '') =>
    String(value || '')
        .split(/[,|/;\n]+/g)
        .map((token) => token.trim())
        .filter(Boolean);

const collapseStudentRows = (columns = [], rows = []) => {
    const studentColumn = columns.find((column = {}) => /student|name/i.test(String(column.key || '')));
    const focusColumn = columns.find((column = {}) => /focus/i.test(String(column.key || '')));
    if (!studentColumn || !focusColumn || !Array.isArray(rows) || rows.length < 2) return rows;

    const gradeColumn = columns.find((column = {}) => /grade|class/i.test(String(column.key || '')));
    const tierColumn = columns.find((column = {}) => /tier/i.test(String(column.key || '')));
    const statusColumn = columns.find((column = {}) => /status/i.test(String(column.key || '')));
    const goalsColumn = columns.find((column = {}) => /goal/i.test(String(column.key || '')));
    const lastCheckInColumn = columns.find((column = {}) => /last.*check|check.*in|updated/i.test(String(column.key || '')));

    const grouped = new Map();
    rows.forEach((row = {}) => {
        const studentValue = String(row?.[studentColumn.key] || '').trim();
        if (!studentValue) return;
        const groupKey = [
            studentValue.toLowerCase(),
            String(row?.[gradeColumn?.key] || '').trim().toLowerCase(),
            String(row?.[tierColumn?.key] || '').trim().toLowerCase(),
            String(row?.[statusColumn?.key] || '').trim().toLowerCase(),
            String(row?.[goalsColumn?.key] || '').trim().toLowerCase(),
            String(row?.[lastCheckInColumn?.key] || '').trim().toLowerCase()
        ].join('::');

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
                ...row,
                __focusSet: new Set()
            });
        }
        const merged = grouped.get(groupKey);
        splitFocusTokens(row?.[focusColumn.key]).forEach((token) => merged.__focusSet.add(token));
    });

    return Array.from(grouped.values()).map((row = {}) => {
        const next = { ...row };
        delete next.__focusSet;
        const focusSet = row.__focusSet instanceof Set ? row.__focusSet : new Set();
        const mergedFocus = Array.from(focusSet).join(', ');
        next[focusColumn.key] = mergedFocus || row?.[focusColumn.key];
        return next;
    });
};

const TableWidget = React.memo(({ widget }) => {
    const columns = Array.isArray(widget?.columns) ? widget.columns : [];
    const rows = Array.isArray(widget?.rows) ? widget.rows : [];
    const collapsedRows = useMemo(() => collapseStudentRows(columns, rows), [columns, rows]);
    if (columns.length === 0 || rows.length === 0) return null;
    const renderedRows = collapsedRows.length > 0 ? collapsedRows : rows;
    const isCollapsed = renderedRows.length < rows.length;

    const renderCell = (columnKey, rawValue) => {
        const key = String(columnKey || '').toLowerCase();
        const value = formatWidgetValue(rawValue);
        const compactValue = String(value || '').toLowerCase();

        if (key.includes('status')) {
            const statusClass = compactValue.includes('active')
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200'
                : compactValue.includes('paused')
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200'
                    : compactValue.includes('closed') || compactValue.includes('complete')
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200';
            return (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}>
                    {value}
                </span>
            );
        }

        if (key.includes('tier')) {
            return (
                <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200">
                    {value}
                </span>
            );
        }

        if (key.includes('priority')) {
            const priorityClass = compactValue.includes('high')
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200'
                : compactValue.includes('medium')
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200';
            return (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClass}`}>
                    {value}
                </span>
            );
        }

        if (key.includes('last') && key.includes('check')) {
            const daysMatch = String(value).match(/\((\d+)\s*d\)/i);
            const days = Number(daysMatch?.[1] || 0);
            const toneClass = days > 30
                ? 'text-rose-700 dark:text-rose-300'
                : days > 14
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-emerald-700 dark:text-emerald-300';
            return <span className={`whitespace-pre-line break-words leading-snug font-medium ${toneClass}`}>{value}</span>;
        }

        if (key.includes('focus')) {
            const tokens = splitFocusTokens(value).slice(0, 5);
            if (tokens.length > 0) {
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {tokens.map((token, index) => (
                            <span
                                key={`${token}-${index}`}
                                className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-cyan-100/85 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200"
                            >
                                {token}
                            </span>
                        ))}
                    </div>
                );
            }
        }

        if (key.includes('student') || key.includes('name')) {
            return <span className="whitespace-pre-line break-words leading-snug font-semibold">{value}</span>;
        }

        return <span className="whitespace-pre-line break-words leading-snug">{value}</span>;
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-600/45 bg-gradient-to-br from-white/96 via-slate-50/92 to-slate-100/90 dark:from-slate-900/78 dark:via-slate-900/74 dark:to-slate-800/72 p-3 mt-3">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">{widget.title || 'Table'}</p>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-white/90 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200">
                    {renderedRows.length} row{renderedRows.length > 1 ? 's' : ''}
                </span>
            </div>
            {widget.subtitle && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{widget.subtitle}</p>
            )}
            {isCollapsed && (
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Duplicate student rows merged by focus area
                </p>
            )}
            <div className="overflow-x-auto overflow-y-auto max-h-[26rem] mt-2 rounded-xl border border-slate-200/80 dark:border-slate-600/40">
                <table className="min-w-full border-separate border-spacing-0 text-[12px] sm:text-sm">
                    <thead className="bg-slate-100/96 dark:bg-slate-800/92 sticky top-0 z-[1]">
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className="px-3 py-2.5 text-left font-semibold uppercase tracking-[0.08em] text-[11px] text-slate-700 dark:text-slate-100 whitespace-nowrap border-b border-slate-300/70 dark:border-slate-600/55">
                                    {column.label || column.key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderedRows.map((row, rowIndex) => (
                            <tr
                                key={`row-${rowIndex}`}
                                className="odd:bg-white/84 even:bg-slate-50/78 dark:odd:bg-slate-900/58 dark:even:bg-slate-800/62 hover:bg-sky-50/65 dark:hover:bg-sky-900/18"
                            >
                                {columns.map((column) => (
                                    <td key={`${rowIndex}-${column.key}`} className="px-3 py-2.5 text-slate-800 dark:text-slate-100 align-top border-b border-slate-200/75 dark:border-slate-700/55">
                                        {renderCell(column.key, row?.[column.key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});
TableWidget.displayName = 'TableWidget';

const StatsWidget = React.memo(({ widget }) => {
    const items = Array.isArray(widget?.items) ? widget.items : [];
    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-lime-200/65 dark:border-lime-200/25 bg-gradient-to-br from-lime-50/90 via-emerald-50/85 to-cyan-50/85 dark:from-lime-500/10 dark:via-emerald-500/10 dark:to-cyan-500/10 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{widget.title || 'Snapshot'}</p>
            {widget.subtitle && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{widget.subtitle}</p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
                {items.slice(0, 6).map((item, index) => (
                    <div
                        key={`${item.label || 'metric'}-${index}`}
                        className="rounded-xl bg-white/80 dark:bg-white/8 border border-white/55 dark:border-white/12 px-2.5 py-2"
                    >
                        <p className="text-[11px] text-slate-500 dark:text-slate-300">{item.label || 'Metric'}</p>
                        <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{formatWidgetValue(item.value)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});
StatsWidget.displayName = 'StatsWidget';

const TimelineWidget = React.memo(({ widget }) => {
    const items = Array.isArray(widget?.items) ? widget.items : [];
    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-200/20 bg-gradient-to-br from-indigo-50/90 via-cyan-50/85 to-pink-50/80 dark:from-indigo-500/10 dark:via-cyan-500/10 dark:to-pink-500/10 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{widget.title || 'Timeline'}</p>
            {widget.subtitle && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{widget.subtitle}</p>
            )}
            <div className="mt-2 space-y-2">
                {items.slice(0, 6).map((item, index) => (
                    <div key={`${item.time || 'time'}-${index}`} className="flex gap-2.5">
                        <div className="shrink-0 w-14 text-[11px] font-bold text-indigo-700 dark:text-indigo-200 pt-0.5">{formatWidgetValue(item.time)}</div>
                        <div className="flex-1 rounded-xl px-2.5 py-2 bg-white/80 dark:bg-white/8 border border-white/60 dark:border-white/12">
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">{formatWidgetValue(item.title)}</p>
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">{formatWidgetValue(item.detail)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
TimelineWidget.displayName = 'TimelineWidget';

const ChecklistWidget = React.memo(({ widget }) => {
    const items = Array.isArray(widget?.items) ? widget.items : [];
    if (items.length === 0) return null;

    const priorityBadgeClass = (priority) => {
        const value = String(priority || '').toLowerCase();
        if (value === 'high') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
        if (value === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    };

    return (
        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-200/20 bg-gradient-to-br from-emerald-50/90 via-lime-50/85 to-cyan-50/80 dark:from-emerald-500/10 dark:via-lime-500/10 dark:to-cyan-500/10 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{widget.title || 'Checklist'}</p>
            <div className="mt-2 space-y-2">
                {items.slice(0, 8).map((item, index) => (
                    <div
                        key={`${item.text || 'item'}-${index}`}
                        className="rounded-xl px-2.5 py-2 bg-white/80 dark:bg-white/8 border border-white/60 dark:border-white/12 flex items-start gap-2"
                    >
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500/90 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]" />
                        <div className="flex-1">
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-white">{formatWidgetValue(item.text)}</p>
                            {item.priority && (
                                <span className={`inline-flex mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${priorityBadgeClass(item.priority)}`}>
                                    {String(item.priority).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
ChecklistWidget.displayName = 'ChecklistWidget';

const CapabilitiesWidget = React.memo(({ widget }) => {
    const items = Array.isArray(widget?.items) ? widget.items : [];
    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-fuchsia-200/60 dark:border-fuchsia-200/20 bg-gradient-to-br from-fuchsia-50/90 via-rose-50/80 to-violet-50/85 dark:from-fuchsia-500/10 dark:via-rose-500/10 dark:to-violet-500/10 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">{widget.title || 'Capabilities'}</p>
            {widget.subtitle && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{widget.subtitle}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {items.slice(0, 8).map((item, index) => (
                    <div
                        key={`${item.title || 'capability'}-${index}`}
                        className="rounded-xl px-2.5 py-2 bg-white/80 dark:bg-white/8 border border-white/60 dark:border-white/12"
                    >
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                            <span className="mr-1">{normalizeIconToken(item.icon, '*')}</span>
                            {formatWidgetValue(item.title)}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">{formatWidgetValue(item.description)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});
CapabilitiesWidget.displayName = 'CapabilitiesWidget';

const ActionChipsWidget = React.memo(({ widget, onWidgetAction }) => {
    const actions = Array.isArray(widget?.actions) ? widget.actions : [];
    if (actions.length === 0) return null;

    return (
        <div className="rounded-2xl border border-cyan-200/60 dark:border-cyan-200/20 bg-gradient-to-br from-cyan-50/90 via-sky-50/80 to-indigo-50/85 dark:from-cyan-500/10 dark:via-sky-500/10 dark:to-indigo-500/10 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{widget.title || 'Quick Actions'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
                {actions.slice(0, 8).map((entry, index) => {
                    const label = entry?.label || `Action ${index + 1}`;
                    const actionPayload = entry?.action || null;
                    return (
                        <button
                            key={`${label}-${index}`}
                            type="button"
                            onClick={() => onWidgetAction?.(actionPayload)}
                            className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white/85 dark:bg-white/10 border border-white/70 dark:border-white/15 hover:brightness-105 transition-all"
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});
ActionChipsWidget.displayName = 'ActionChipsWidget';

const SkillCardsWidget = React.memo(({ widget, onWidgetAction }) => {
    const cards = Array.isArray(widget?.cards) ? widget.cards : [];
    if (cards.length === 0) return null;

    return (
        <div className="rounded-2xl border border-violet-200/60 dark:border-violet-200/20 bg-gradient-to-br from-violet-50/90 via-fuchsia-50/80 to-cyan-50/85 dark:from-violet-500/10 dark:via-fuchsia-500/10 dark:to-cyan-500/10 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{widget.title || 'Adaptive Skills'}</p>
            {widget.subtitle && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{widget.subtitle}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {cards.slice(0, 6).map((card, index) => (
                    <div
                        key={card.id || `${card.title || 'skill'}-${index}`}
                        className="rounded-xl bg-white/82 dark:bg-white/8 border border-white/65 dark:border-white/14 px-3 py-2"
                    >
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <span className="mr-1">{normalizeIconToken(card.icon, '*')}</span>
                            {card.title || 'Skill'}
                        </p>
                        {card.description && (
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">{card.description}</p>
                        )}
                        {card.action && (
                            <button
                                type="button"
                                onClick={() => onWidgetAction?.(card.action)}
                                className="mt-2 inline-flex px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-violet-700 dark:text-violet-200 bg-violet-100/85 dark:bg-violet-500/20 border border-violet-200/70 dark:border-violet-400/25 hover:brightness-105 transition-all"
                            >
                                Use skill
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});
SkillCardsWidget.displayName = 'SkillCardsWidget';

const AssistantWidgets = React.memo(({ widgets, isUser, onWidgetAction, canHydrateRichWidgets }) => {
    const normalizedWidgets = useMemo(
        () => (
            Array.isArray(widgets)
                ? widgets
                    .filter((widget) => widget && typeof widget === 'object')
                    .filter((widget) => isWidgetTypeSupported(widget.type))
                    .slice(0, 6)
                : []
        ),
        [widgets]
    );

    if (isUser || normalizedWidgets.length === 0) return null;

    return (
        <div className="space-y-2">
            {normalizedWidgets.map((widget, index) => {
                const key = widget.id || `${widget.type || 'widget'}-${index}`;
                if (widget.type === ASSISTANT_WIDGET_TYPES.BAR_CHART) {
                    if (!canHydrateRichWidgets) return <ChartWidgetFallback key={key} widget={widget} />;
                    return <ChartWidget key={key} widget={widget} />;
                }
                if (widget.type === ASSISTANT_WIDGET_TYPES.TABLE) return <TableWidget key={key} widget={widget} />;
                if (widget.type === ASSISTANT_WIDGET_TYPES.STATS) return <StatsWidget key={key} widget={widget} />;
                if (widget.type === ASSISTANT_WIDGET_TYPES.TIMELINE) return <TimelineWidget key={key} widget={widget} />;
                if (widget.type === ASSISTANT_WIDGET_TYPES.CHECKLIST) return <ChecklistWidget key={key} widget={widget} />;
                if (widget.type === ASSISTANT_WIDGET_TYPES.CAPABILITIES) return <CapabilitiesWidget key={key} widget={widget} />;
                if (widget.type === ASSISTANT_WIDGET_TYPES.ACTION_CHIPS) return <ActionChipsWidget key={key} widget={widget} onWidgetAction={onWidgetAction} />;
                if (widget.type === ASSISTANT_WIDGET_TYPES.SKILL_CARDS) return <SkillCardsWidget key={key} widget={widget} onWidgetAction={onWidgetAction} />;
                return null;
            })}
        </div>
    );
});
AssistantWidgets.displayName = 'AssistantWidgets';

const MessageBubble = React.memo(({ message, isUser, onWidgetAction }) => {
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [canHydrateRichContent, setCanHydrateRichContent] = useState(isUser);
    const bubbleRef = useRef(null);
    const formattedContent = useMemo(
        () => preprocessMarkdownContent(message.content),
        [message.content]
    );

    const reactions = ['👍', '❤️', '😂', '🤔', '🎉'];

    const handleReaction = useCallback((reaction) => {
        setSelectedReaction(reaction);
        setShowReactions(false);
    }, []);

    useEffect(() => {
        if (isUser || canHydrateRichContent) return;
        const node = bubbleRef.current;
        if (!node || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            setCanHydrateRichContent(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setCanHydrateRichContent(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '240px 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [canHydrateRichContent, isUser]);

    return (
        <div className="relative group" ref={bubbleRef}>
            <div
                className={`message-bubble rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-4 ${isUser
                    ? 'chat-gradient-border bg-[linear-gradient(130deg,_rgb(34_211_238)_0%,_rgb(139_92_246)_52%,_rgb(251_113_133)_100%)] text-white'
                    : 'chat-soft-panel backdrop-blur-sm text-gray-800 dark:text-gray-100'
                    }`}
                onMouseEnter={() => !isUser && setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
            >
                <div className={`chat-markdown ${isUser ? 'chat-markdown-user' : 'chat-markdown-assistant'} text-sm sm:text-base leading-relaxed`}>
                    {canHydrateRichContent ? (
                        <Suspense fallback={<p className="my-1 whitespace-pre-wrap leading-relaxed">{formattedContent}</p>}>
                            <LazyMarkdownRenderer content={formattedContent} isUser={isUser} />
                        </Suspense>
                    ) : (
                        <p className="my-1 whitespace-pre-wrap leading-relaxed">{formattedContent}</p>
                    )}
                </div>
                <AssistantWidgets
                    widgets={message.widgets}
                    isUser={isUser}
                    onWidgetAction={onWidgetAction}
                    canHydrateRichWidgets={canHydrateRichContent}
                />

                {!isUser && showReactions && (
                    <div className="absolute -bottom-8 left-0 flex gap-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-lg border border-gray-200/50 dark:border-white/10">
                        {reactions.map((reaction, i) => (
                            <button
                                key={reaction}
                                onClick={() => handleReaction(reaction)}
                                className="reaction-button hover:scale-125 transition-transform text-lg"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                {reaction}
                            </button>
                        ))}
                    </div>
                )}

                {selectedReaction && (
                    <div className="absolute -top-3 -right-3 message-reaction text-2xl">
                        {selectedReaction}
                    </div>
                )}
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
