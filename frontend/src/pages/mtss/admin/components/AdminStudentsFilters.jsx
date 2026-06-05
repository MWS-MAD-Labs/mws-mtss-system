import { Search, Shuffle, Filter } from "lucide-react";

const AdminStudentsFilters = ({
    filters,
    onFilterChange,
    gradeOptions,
    tierOptions,
    typeOptions,
    mentorOptions,
    filteredCount,
    totalCount,
}) => {
    const filterClass =
        "w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 text-sm text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner shadow-white/40 dark:shadow-none";

    const getOptionValue = (option) => (typeof option === "object" ? option.value : option);

    const renderSelect = (value, options, field, labelFn, animation) => (
        <div
            data-aos={animation?.variant || "fade-up"}
            data-aos-delay={animation?.delay || 0}
            data-aos-duration="650"
            data-aos-easing="ease-out-cubic"
        >
            <select className={filterClass} value={value} onChange={(event) => onFilterChange(field, event.target.value)}>
                {options.map((option) => (
                    <option key={getOptionValue(option)} value={getOptionValue(option)}>
                        {labelFn(option)}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div
            className="glass glass-card mtss-card-surface p-6 rounded-[36px] border border-white/20 bg-gradient-to-br from-[#ecfeff]/90 via-[#fef9c3]/80 to-[#fce7f3]/85 dark:from-white/5 dark:via-white/10 dark:to-white/5 backdrop-blur-2xl"
            data-aos="fade-up"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="space-y-1" data-aos="fade-right" data-aos-duration="700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-white">
                        <Filter className="w-3.5 h-3.5" />
                        Smart filters
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-white/60">
                        Blend grade, tier, subject, focus area, and mentor filters to spot caseload gaps instantly.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-white/70" data-aos="fade-left">
                    <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/20 backdrop-blur">
                        {filteredCount} matches
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/20 backdrop-blur">
                        {totalCount} total roster
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/20 backdrop-blur flex items-center gap-1">
                        <Shuffle className="w-4 h-4" />
                        auto-sort ready
                    </span>
                </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
                {renderSelect(filters.grade, gradeOptions, "grade", (value) => (value === "all" ? "All Grades" : value), {
                    variant: "fade-up-right",
                    delay: 80,
                })}
                {renderSelect(filters.tier, tierOptions, "tier", (value) => (value === "all" ? "All Tiers" : value), {
                    variant: "fade-up",
                    delay: 120,
                })}
                {renderSelect(filters.type, typeOptions, "type", (option) => (option?.value === "all" ? "All Subjects / Focus Areas" : option?.label || option), {
                    variant: "fade-up-left",
                    delay: 160,
                })}
                {renderSelect(filters.mentor, mentorOptions, "mentor", (value) => (value === "all" ? "All Mentors" : value), {
                    variant: "zoom-in-up",
                    delay: 200,
                })}
                <div
                    className="relative"
                    data-aos="fade-down"
                    data-aos-delay="220"
                    data-aos-duration="650"
                    data-aos-easing="ease-out-quart"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                    <input
                        type="text"
                        className={`${filterClass} pl-10`}
                        placeholder="Search students"
                        value={filters.query}
                        onChange={(event) => onFilterChange("query", event.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminStudentsFilters;
