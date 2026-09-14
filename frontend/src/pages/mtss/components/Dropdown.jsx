import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

// Generic portal-based dropdown - shared base behind every custom select in
// MTSS Studio (SupportUnitPicker's pill trigger, and the form-field selects
// in InterventionFormFields). Exists because a native <select>'s popup
// can't be styled (browser-rendered, no border-radius/shadow/hover
// control), same reasoning as mws-data-center's SearchableSelect.
const SEARCH_THRESHOLD = 8;

const Dropdown = ({
    options = [], // [{ value, label, disabled }]
    value,
    onChange,
    placeholder = "Select",
    disabled = false,
    searchPlaceholder = "Search...",
    triggerClassName = "",
    panelClassName = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [panelRect, setPanelRect] = useState(null);
    const wrapperRef = useRef(null);
    const panelRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedOption = options.find((option) => option.value === value) || null;
    const shouldSearch = options.length >= SEARCH_THRESHOLD;
    const filteredOptions = shouldSearch && searchTerm.trim()
        ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        : options;

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
            const estimatedHeight = 280;
            const spaceBelow = window.innerHeight - rect.bottom;
            const flip = spaceBelow < estimatedHeight && rect.top > spaceBelow;
            setPanelRect({
                left: rect.left,
                width: rect.width,
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

    useEffect(() => {
        if (isOpen && shouldSearch) searchInputRef.current?.focus();
        if (!isOpen) setSearchTerm("");
    }, [isOpen, shouldSearch]);

    const selectOption = (option) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => setIsOpen((current) => !current)}
                className={`w-full flex items-center justify-between gap-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
            >
                <span className={`truncate ${selectedOption ? "" : "text-muted-foreground"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Panel width matches the trigger exactly so it never spills
                wider than the button that opened it. */}
            {isOpen && panelRect
                ? createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            position: "fixed",
                            left: panelRect.left,
                            width: panelRect.width,
                            ...(panelRect.flip ? { bottom: panelRect.bottom + 6 } : { top: panelRect.top + 6 }),
                        }}
                        className={`z-[100] overflow-hidden ${panelClassName}`}
                    >
                        {shouldSearch && (
                            <label className="relative block border-b border-slate-100 dark:border-slate-800">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="search"
                                    value={searchTerm}
                                    placeholder={searchPlaceholder}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none text-foreground dark:text-white"
                                />
                            </label>
                        )}
                        {/* No vertical padding here - rows sit flush against
                            the panel's own edge so overflow-hidden clips the
                            first/last row cleanly into its rounded corner
                            instead of leaving a plain gap that breaks the
                            curve (the square highlighted row used to visibly
                            end short of where the panel rounds off). */}
                        <div role="listbox" className="max-h-64 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-3 text-sm text-muted-foreground">No options found</div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            disabled={option.disabled}
                                            onClick={() => selectOption(option)}
                                            // outline-none + an inset focus-visible ring instead of the
                                            // browser's own default focus outline - without this, the
                                            // native outline (a darker blue box) sat alongside the
                                            // selected/hover background instead of being covered by it,
                                            // especially visible on the last row in the list.
                                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/60 ${
                                                option.disabled
                                                    ? "cursor-not-allowed opacity-50"
                                                    : isSelected
                                                        ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 font-semibold"
                                                        : "text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                                            }`}
                                        >
                                            <span className="truncate">{option.label}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )
                : null}
        </div>
    );
};

export default Dropdown;
