import Dropdown from "./Dropdown";

// Pill-style wrapper around the shared Dropdown base, for the Spotlight
// header's "student / support unit" picker - matches the prev/next circle
// buttons and the other glass badges around it.
const SupportUnitPicker = ({ units = [], value, onChange, placeholder = "Select a student" }) => {
    const getId = (unit) => unit?.id || unit?._id || "";
    const getLabel = (unit) =>
        unit?.supportUnit?.subject ? `${unit.name} - ${unit.supportUnit.subject}` : unit?.name || "Unnamed student";

    const options = units.map((unit) => ({ value: getId(unit), label: getLabel(unit) }));

    return (
        <div className="flex-1 min-w-0 sm:flex-none sm:min-w-[220px] sm:max-w-xs">
            <Dropdown
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                searchPlaceholder="Search students..."
                triggerClassName="pl-4 pr-3 py-2 rounded-full bg-white/90 dark:bg-white/10 border border-white/60 dark:border-white/20 text-sm font-semibold text-foreground dark:text-white shadow-sm outline-none transition hover:-translate-y-0.5 focus:ring-2 focus:ring-indigo-500/30"
                panelClassName="rounded-3xl border border-white/60 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]"
            />
        </div>
    );
};

export default SupportUnitPicker;
