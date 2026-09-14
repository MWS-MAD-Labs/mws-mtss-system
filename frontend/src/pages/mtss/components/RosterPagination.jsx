import { ChevronLeft, ChevronRight } from "lucide-react";

// Shared Prev/Next pagination footer for student rosters (Dashboard "Live
// Roster" and the teacher "My Students" panel) - replaces the old "Load
// more" batch-append pattern in both places.
const RosterPagination = ({ page, totalPages, setPage, rangeStart, rangeEnd, totalCount, itemLabel = "students" }) => {
    const pageNumbers = (() => {
        const numbers = new Set([1, totalPages, page, page - 1, page + 1]);
        return Array.from(numbers)
            .filter((n) => n >= 1 && n <= totalPages)
            .sort((a, b) => a - b);
    })();

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                Showing {rangeStart}–{rangeEnd} of {totalCount} {itemLabel}
            </p>

            {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {pageNumbers.map((n, i) => {
                        const prev = pageNumbers[i - 1];
                        const showGap = prev !== undefined && n - prev > 1;
                        return (
                            <span key={n} className="flex items-center gap-1.5">
                                {showGap && <span className="px-1 text-slate-300 dark:text-slate-600 text-xs">…</span>}
                                <button
                                    type="button"
                                    onClick={() => setPage(n)}
                                    aria-current={n === page ? "page" : undefined}
                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors ${
                                        n === page
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_6px_16px_rgba(99,102,241,0.35)]"
                                            : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {n}
                                </button>
                            </span>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Next page"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RosterPagination;
