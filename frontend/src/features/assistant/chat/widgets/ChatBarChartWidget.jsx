import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const formatWidgetValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Intl.NumberFormat('en-US').format(value);
    }
    return String(value || '')
        .replace(/&lt;br\s*\/?&gt;/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const toNumericWidgetValue = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        const match = normalized.match(/-?\d+(?:\.\d+)?/);
        if (match) {
            const parsed = Number(match[0]);
            if (Number.isFinite(parsed)) return parsed;
        }
    }
    return null;
};

const ChatBarChartWidget = React.memo(({ widget }) => {
    const data = Array.isArray(widget?.data) ? widget.data : [];
    const xKey = widget?.xKey || 'label';
    const yKey = widget?.yKey || 'value';
    const numericData = data
        .map((entry = {}) => ({
            ...entry,
            [xKey]: formatWidgetValue(entry?.[xKey] || entry?.label || entry?.tierLabel || entry?.name || '-'),
            [yKey]: toNumericWidgetValue(entry?.[yKey] ?? entry?.value ?? entry?.tierValue ?? entry?.count ?? entry?.total)
        }))
        .filter((entry) => Number.isFinite(entry?.[yKey]));
    const hasSinglePoint = numericData.length === 1;
    const computedMax = numericData.length > 0
        ? Math.max(...numericData.map((entry) => Number(entry?.[yKey] || 0)), 1)
        : 1;
    const yDomain = Array.isArray(widget?.yDomain) && widget.yDomain.length === 2
        ? widget.yDomain
        : [0, computedMax];
    const yTicks = Array.isArray(widget?.yTicks) && widget.yTicks.length > 0 ? widget.yTicks : undefined;
    const gradientId = `chat-widget-gradient-${String(widget?.id || 'chart').replace(/[^a-zA-Z0-9_-]/g, '')}`;

    if (numericData.length === 0) {
        return (
            <div className="rounded-2xl border border-cyan-200/65 dark:border-cyan-300/25 bg-gradient-to-br from-cyan-50/95 via-sky-50/90 to-indigo-50/90 dark:from-cyan-500/12 dark:via-sky-500/10 dark:to-indigo-500/14 p-3 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
                    {widget?.title || 'Chart'}
                </p>
                {widget?.subtitle && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{widget.subtitle}</p>
                )}
                <div className="mt-2 rounded-xl border border-dashed border-slate-300/80 dark:border-slate-500/45 bg-white/78 dark:bg-slate-900/45 px-3 py-2.5">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        No numeric data available yet for chart rendering.
                    </p>
                </div>
            </div>
        );
    }

    if (hasSinglePoint) {
        const single = numericData[0];
        const maxValue = Math.max(Number(yDomain?.[1] || computedMax || 1), 1);
        const ratio = Math.min(100, Math.max(0, (Number(single?.[yKey] || 0) / maxValue) * 100));

        return (
            <div className="rounded-2xl border border-cyan-200/65 dark:border-cyan-300/25 bg-gradient-to-br from-cyan-50/95 via-sky-50/90 to-indigo-50/90 dark:from-cyan-500/12 dark:via-sky-500/10 dark:to-indigo-500/14 p-3 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
                    {widget?.title || 'Chart'}
                </p>
                {widget?.subtitle && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{widget.subtitle}</p>
                )}
                <div className="mt-3 rounded-xl border border-white/70 dark:border-white/15 bg-white/85 dark:bg-slate-900/40 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {formatWidgetValue(single?.[xKey])}
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatWidgetValue(single?.[yKey])}
                        </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#06b6d4_0%,#8b5cf6_55%,#f472b6_100%)]"
                            style={{ width: `${ratio}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-cyan-200/65 dark:border-cyan-300/25 bg-gradient-to-br from-cyan-50/95 via-sky-50/90 to-indigo-50/90 dark:from-cyan-500/12 dark:via-sky-500/10 dark:to-indigo-500/14 p-3 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
                {widget?.title || 'Chart'}
            </p>
            {widget?.subtitle && (
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{widget.subtitle}</p>
            )}
            <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={numericData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.95} />
                                <stop offset="55%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f472b6" stopOpacity={0.85} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" vertical={false} />
                        <XAxis
                            dataKey={xKey}
                            tick={{ fontSize: 11, fill: '#334155' }}
                            axisLine={{ stroke: 'rgba(100,116,139,0.28)' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={yDomain}
                            ticks={yTicks}
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: '#334155' }}
                            axisLine={{ stroke: 'rgba(100,116,139,0.28)' }}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                            contentStyle={{
                                borderRadius: '0.9rem',
                                border: '1px solid rgba(148,163,184,0.35)',
                                background: 'rgba(255,255,255,0.96)',
                                fontSize: '12px'
                            }}
                        />
                        <Bar dataKey={yKey} radius={[8, 8, 0, 0]} fill={`url(#${gradientId})`} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

ChatBarChartWidget.displayName = 'ChatBarChartWidget';

export default ChatBarChartWidget;
