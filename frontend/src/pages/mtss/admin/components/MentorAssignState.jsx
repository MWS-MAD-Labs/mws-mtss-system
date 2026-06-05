import { ArrowLeft, Loader2 } from "lucide-react";

export const MentorAssignLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f2fe] via-[#fdf2f8] to-[#fefce8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Loading mentor & student data...</span>
        </div>
    </div>
);

export const MentorAssignError = ({ error, onBack }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f2fe] via-[#fdf2f8] to-[#fefce8] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <div className="max-w-md w-full rounded-3xl border border-white/40 dark:border-white/10 bg-white/90 dark:bg-slate-800/90 shadow-xl p-6 text-center space-y-4">
            <p className="text-lg font-semibold text-destructive">{error || "Mentor not found."}</p>
            <p className="text-sm text-muted-foreground">Please head back to the dashboard and try another mentor.</p>
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#a855f7] text-white font-semibold"
            >
                <ArrowLeft className="w-4 h-4" />
                Go back
            </button>
        </div>
    </div>
);
