import { memo } from "react";
import { Search, Loader2 } from "lucide-react";

const StudentSelectionList = memo(({
    students,
    visibleStudents,
    filteredStudents,
    selectedIds,
    search,
    onSearchChange,
    onToggleSelection,
    onLoadMore
}) => (
    <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-sm font-semibold text-foreground dark:text-white">Select at least two students for this caseload</p>
                <p className="text-xs text-muted-foreground">
                    Scroll gently — students load 10 at a time for smoother performance.
                </p>
            </div>
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search name, grade, or class..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border/60 bg-white/95 dark:bg-white/10 text-sm focus:ring-2 focus:ring-primary/40"
                />
            </div>
        </div>

        <div
            className="max-h-[360px] overflow-y-auto rounded-[28px] border border-white/60 dark:border-white/10 bg-gradient-to-br from-white/95 via-[#fdf2f8]/80 to-[#ecfeff]/80 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/40 p-5 space-y-3 custom-scroll backdrop-blur-xl"
            data-aos="fade-up"
            data-aos-delay="360"
        >
            {!students.length ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm font-semibold text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <p>Fetching roster...</p>
                    <p className="text-xs text-muted-foreground/80">
                        Scroll softly - students load in micro-batches.
                    </p>
                </div>
            ) : (
                <>
                    {visibleStudents.map((student, index) => (
                        <label
                            key={student.id || student._id}
                            className="flex items-start gap-3 text-sm text-foreground dark:text-white cursor-pointer rounded-2xl border border-white/60 dark:border-white/10 bg-white/85 dark:bg-white/5 px-3 py-2 shadow-sm hover:border-primary/40 transition"
                            data-aos="fade-up"
                            data-aos-delay={380 + index * 20}
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(student.id || student._id)}
                                onChange={() => onToggleSelection(student.id || student._id)}
                                className="mt-1 rounded border-border/60 accent-primary w-4 h-4"
                            />
                            <div>
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {student.grade || "No grade"} &middot; {student.className || student.type || "MTSS"}
                                </p>
                            </div>
                        </label>
                    ))}
                    {!visibleStudents.length && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No students match the search.
                        </p>
                    )}
                    {visibleStudents.length < filteredStudents.length && (
                        <button
                            type="button"
                            onClick={onLoadMore}
                            className="w-full text-sm font-semibold text-primary px-4 py-3 rounded-2xl border border-primary/30 bg-white/70 dark:bg-white/10 hover:bg-white transition"
                        >
                            Load 10 more students
                        </button>
                    )}
                </>
            )}
        </div>
    </div>
));

StudentSelectionList.displayName = "StudentSelectionList";
export default StudentSelectionList;
