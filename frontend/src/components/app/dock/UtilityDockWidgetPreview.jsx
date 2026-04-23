import { memo } from "react";

const MAX_WIDGETS = 2;
const MAX_TABLE_COLUMNS = 4;
const MAX_TABLE_ROWS = 4;
const MAX_CHECKLIST_ITEMS = 6;
const MAX_ACTIONS = 5;
const MAX_STATS = 3;
const MAX_BARS = 5;

const toList = (value) => (Array.isArray(value) ? value : []);
const toText = (value, max = 120) =>
    String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

const formatCell = (value) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "-";
    return text.length > 40 ? `${text.slice(0, 39)}...` : text;
};

const WidgetActions = memo(function WidgetActions({ actions = [], onAction }) {
    const entries = toList(actions).slice(0, MAX_ACTIONS);
    if (entries.length === 0) return null;

    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {entries.map((entry, index) => {
                const label = toText(entry?.label || "Action", 60) || "Action";
                const action = entry?.action || null;
                if (!action) return null;
                return (
                    <button
                        key={`${label}-${index}`}
                        type="button"
                        onClick={() => onAction?.(action)}
                        className="rounded-full border border-cyan-300/65 dark:border-cyan-300/35 bg-white/95 dark:bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-200 hover:bg-cyan-50/95 dark:hover:bg-cyan-400/15 transition-colors"
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
});

const TableWidget = memo(function TableWidget({ widget = {} }) {
    const columns = toList(widget.columns).slice(0, MAX_TABLE_COLUMNS);
    const rows = toList(widget.rows).slice(0, MAX_TABLE_ROWS);
    if (columns.length === 0 || rows.length === 0) return null;

    return (
        <div className="mt-2 overflow-hidden rounded-xl border border-cyan-200/65 dark:border-cyan-300/30">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[240px] border-collapse text-[10px]">
                    <thead className="bg-cyan-100/75 dark:bg-cyan-500/10 text-slate-700 dark:text-slate-200">
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className="px-2 py-1 text-left font-semibold">
                                    {toText(column.label || column.key, 38)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={`dock-row-${rowIndex}`}
                                className="border-t border-cyan-100/65 dark:border-cyan-200/15 text-slate-700 dark:text-slate-100"
                            >
                                {columns.map((column) => (
                                    <td key={`${rowIndex}-${column.key}`} className="px-2 py-1 align-top">
                                        {formatCell(row?.[column.key])}
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

const ChecklistWidget = memo(function ChecklistWidget({ widget = {} }) {
    const items = toList(widget.items)
        .slice(0, MAX_CHECKLIST_ITEMS)
        .map((item) => {
            if (typeof item === "string") {
                return { label: toText(item, 96), checked: false };
            }
            return {
                label: toText(item?.label || item?.title || item?.text, 96),
                checked: Boolean(item?.checked || item?.done || item?.completed)
            };
        })
        .filter((entry) => entry.label);

    if (items.length === 0) return null;

    return (
        <ul className="mt-2 space-y-1.5">
            {items.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-start gap-1.5 text-[10px] text-slate-700 dark:text-slate-100">
                    <span
                        className={`mt-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[8px] ${
                            item.checked
                                ? "border-emerald-400 bg-emerald-400/20 text-emerald-700 dark:text-emerald-300"
                                : "border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-300"
                        }`}
                    >
                        {item.checked ? "✓" : "•"}
                    </span>
                    <span className={item.checked ? "line-through opacity-80" : ""}>{item.label}</span>
                </li>
            ))}
        </ul>
    );
});

const StatsWidget = memo(function StatsWidget({ widget = {} }) {
    const items = toList(widget.items)
        .slice(0, MAX_STATS)
        .map((item = {}, index) => ({
            id: item.id || `stat-${index}`,
            label: toText(item.label || item.title, 46),
            value: toText(item.value, 22)
        }))
        .filter((entry) => entry.label && entry.value);

    if (items.length === 0) return null;

    return (
        <div className="mt-2 grid grid-cols-1 gap-1.5">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="rounded-lg border border-cyan-200/65 dark:border-cyan-300/25 bg-white/90 dark:bg-slate-900/60 px-2 py-1"
                >
                    <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{item.label}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
                </div>
            ))}
        </div>
    );
});

const BarChartWidget = memo(function BarChartWidget({ widget = {} }) {
    const xKey = toText(widget.xKey || "label", 30) || "label";
    const yKey = toText(widget.yKey || "value", 30) || "value";
    const rows = toList(widget.data)
        .slice(0, MAX_BARS)
        .map((entry = {}) => {
            const label = toText(entry[xKey] || entry.label || "-", 32) || "-";
            const rawValue = Number(entry[yKey] ?? entry.value ?? 0);
            const value = Number.isFinite(rawValue) ? rawValue : 0;
            return { label, value };
        });

    if (rows.length === 0) return null;
    const maxValue = Math.max(...rows.map((entry) => entry.value), 1);

    return (
        <div className="mt-2 space-y-1.5">
            {rows.map((row) => {
                const percentage = Math.max(6, Math.round((row.value / maxValue) * 100));
                return (
                    <div key={`${row.label}-${row.value}`} className="text-[10px]">
                        <div className="mb-0.5 flex items-center justify-between text-slate-700 dark:text-slate-200">
                            <span>{row.label}</span>
                            <span className="font-semibold">{row.value}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/60">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

const SingleWidget = memo(function SingleWidget({ widget = {}, onAction }) {
    const type = toText(widget.type, 30).toLowerCase();
    const title = toText(widget.title || "", 70);
    const subtitle = toText(widget.subtitle || "", 140);

    const showActions = type === "action_chips"
        ? toList(widget.actions)
        : type === "skill_cards"
            ? toList(widget.cards).map((card = {}) => ({
                label: toText(card.title || "Use skill", 60),
                action: card.action
            }))
            : [];

    const renderByType = () => {
        if (type === "table") return <TableWidget widget={widget} />;
        if (type === "checklist") return <ChecklistWidget widget={widget} />;
        if (type === "stats") return <StatsWidget widget={widget} />;
        if (type === "bar_chart") return <BarChartWidget widget={widget} />;
        if (type === "action_chips") return null;
        if (type === "skill_cards") return null;
        return null;
    };

    return (
        <section className="mt-2 rounded-xl border border-cyan-200/65 dark:border-cyan-300/25 bg-cyan-50/70 dark:bg-slate-900/60 px-2 py-1.5">
            {title ? <p className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-200">{title}</p> : null}
            {subtitle ? <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">{subtitle}</p> : null}
            {renderByType()}
            <WidgetActions actions={showActions} onAction={onAction} />
        </section>
    );
});

const UtilityDockWidgetPreview = memo(function UtilityDockWidgetPreview({ widgets = [], onAction }) {
    const safeWidgets = toList(widgets).slice(0, MAX_WIDGETS);
    if (safeWidgets.length === 0) return null;

    return (
        <div className="mt-1.5 space-y-1.5">
            {safeWidgets.map((widget, index) => (
                <SingleWidget
                    key={`${widget?.id || widget?.type || "widget"}-${index}`}
                    widget={widget}
                    onAction={onAction}
                />
            ))}
        </div>
    );
});

export default UtilityDockWidgetPreview;
