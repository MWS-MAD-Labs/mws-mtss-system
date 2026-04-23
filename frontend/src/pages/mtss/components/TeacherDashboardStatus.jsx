import { Loader2 } from "lucide-react";

const TeacherDashboardStatus = ({ loading, error, onRetry }) => {
    if (!loading && !error) return null;

    return (
        <div
            className="rounded-2xl border border-border/50 bg-white/60 dark:bg-white/5 px-4 py-3 flex items-center justify-between gap-4 text-sm text-muted-foreground"
            data-aos="fade-up"
        >
            <div className="flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                <span>{error ? error : "Syncing live MTSS data..."}</span>
            </div>
            {error && (
                <button onClick={onRetry} className="text-primary font-semibold hover:underline">
                    Retry
                </button>
            )}
        </div>
    );
};

export default TeacherDashboardStatus;
