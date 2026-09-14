import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// Custom calendar popup, same idea as Central's DateField (MUI DatePicker
// wrapper): a native <input type="date">'s own popup can't be styled and
// looks different per browser/OS. This keeps the same "YYYY-MM-DD" value
// contract as the native input it replaces, so callers don't change,
// while showing the date as DD/MM/YYYY like Central does.
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const parseISODate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
    const date = parseISODate(value);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
};

const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Mon-first grid of 6 weeks (42 cells) covering the full month plus
// leading/trailing days from neighboring months, so the grid height never
// shifts between months.
const buildMonthGrid = (year, month) => {
    const firstOfMonth = new Date(year, month, 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + i);
        return date;
    });
};

const CalendarField = ({ value, onChange, placeholder = "Select date", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [panelRect, setPanelRect] = useState(null);
    const selectedDate = parseISODate(value);
    const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
    const wrapperRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (isOpen) setViewDate(selectedDate || new Date());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const handlePointerDown = (event) => {
            if (!wrapperRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isOpen) {
            setPanelRect(null);
            return undefined;
        }
        const reposition = () => {
            const trigger = wrapperRef.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            const estimatedHeight = 360;
            const spaceBelow = window.innerHeight - rect.bottom;
            const flip = spaceBelow < estimatedHeight && rect.top > spaceBelow;
            setPanelRect({
                left: rect.left,
                top: rect.bottom,
                bottom: window.innerHeight - rect.top,
                flip,
            });
        };
        reposition();
        window.addEventListener("resize", reposition);
        document.addEventListener("scroll", reposition, true);
        return () => {
            window.removeEventListener("resize", reposition);
            document.removeEventListener("scroll", reposition, true);
        };
    }, [isOpen]);

    const today = new Date();
    const gridDays = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

    const selectDay = (date) => {
        onChange(toISODate(date));
        setIsOpen(false);
    };

    const goToMonth = (delta) => {
        setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className={`w-full flex items-center justify-between gap-2 text-left outline-none ${className}`}
            >
                <span className={value ? "" : "text-muted-foreground"}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
            </button>

            {isOpen && panelRect
                ? createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            position: "fixed",
                            left: panelRect.left,
                            width: 280,
                            ...(panelRect.flip ? { bottom: panelRect.bottom + 6 } : { top: panelRect.top + 6 }),
                        }}
                        className="z-[100] overflow-hidden rounded-2xl border border-white/70 dark:border-white/15 bg-white dark:bg-slate-900 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] p-3"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={() => goToMonth(-1)}
                                aria-label="Previous month"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition outline-none"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </span>
                            <button
                                type="button"
                                onClick={() => goToMonth(1)}
                                aria-label="Next month"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition outline-none"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {WEEKDAY_LABELS.map((label) => (
                                <div key={label} className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 py-1">
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {gridDays.map((date) => {
                                const inCurrentMonth = date.getMonth() === viewDate.getMonth();
                                const selected = isSameDay(date, selectedDate);
                                const isToday = isSameDay(date, today);
                                return (
                                    <button
                                        key={date.toISOString()}
                                        type="button"
                                        onClick={() => selectDay(date)}
                                        className={`h-8 rounded-lg text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/60 ${
                                            selected
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-sm"
                                                : inCurrentMonth
                                                    ? `text-foreground dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 ${isToday ? "ring-1 ring-inset ring-indigo-300 dark:ring-indigo-500/50" : ""}`
                                                    : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => selectDay(today)}
                            className="mt-2 w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline outline-none py-1"
                        >
                            Today
                        </button>
                    </div>,
                    document.body,
                )
                : null}
        </div>
    );
};

export default CalendarField;
