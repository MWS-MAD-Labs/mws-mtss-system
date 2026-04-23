const AdminMentorsFooter = ({ visibleCount, total }) => (
    <div className="mt-8 flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground" data-aos="fade-up">
        <span>
            Showing {visibleCount} of {total} mentors
        </span>
        {visibleCount < total ? (
            <span className="px-3 py-1 rounded-full border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 text-[0.65rem] uppercase tracking-[0.3em]">
                Scroll to load more
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full border border-emerald-200/60 bg-emerald-50 text-emerald-600 text-[0.65rem] uppercase tracking-[0.3em]">
                All mentors loaded
            </span>
        )}
    </div>
);

export default AdminMentorsFooter;
