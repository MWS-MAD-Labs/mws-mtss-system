import { memo, useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCcw } from "lucide-react";
import { fetchAssignmentsNeedingReassignment, updateMentorAssignment } from "@/services/mtssService";

// Admin-only view of every active/paused intervention whose mentor's
// current grade/unit no longer covers the assigned student - e.g. Central
// moved a Junior High teacher to SD mid-intervention (see
// useTeacherDashboardData's matching client-side check, which is what
// first surfaces this to the mentor themselves via
// OutOfScopeAssignmentsBanner). Reassigning here is the other half of that
// flow: the mentor can only see it, an admin is the one who acts on it.
const AdminReassignmentPanel = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMentorByAssignment, setSelectedMentorByAssignment] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [justReassignedId, setJustReassignedId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = await fetchAssignmentsNeedingReassignment();
            setAssignments(payload?.assignments || []);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load reassignment queue");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleReassign = async (assignmentId) => {
        const newMentorId = selectedMentorByAssignment[assignmentId];
        if (!newMentorId) return;

        setSavingId(assignmentId);
        try {
            await updateMentorAssignment(assignmentId, { mentorId: newMentorId });
            setAssignments((prev) => prev.filter((item) => item.assignmentId !== assignmentId));
            setJustReassignedId(assignmentId);
            setTimeout(() => setJustReassignedId(null), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to reassign this intervention");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Needs Reassignment</h2>
                    <p className="text-sm text-slate-600 dark:text-white/70">
                        Interventions whose mentor's unit assignment no longer covers the student.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-white"
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-200">
                    {error}
                </div>
            )}

            {!loading && !assignments.length && !error && (
                <div className="rounded-2xl border border-white/50 bg-white/70 px-4 py-6 text-center text-sm text-muted-foreground dark:bg-white/5">
                    Nothing needs reassignment right now.
                </div>
            )}

            <div className="space-y-3">
                {assignments.map((assignment) => (
                    <div
                        key={assignment.assignmentId}
                        className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-4 dark:border-amber-500/25 dark:bg-amber-900/15"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2.5">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                        {assignment.studentNames.join(", ") || "Unnamed student"}
                                        {assignment.grade ? ` — ${assignment.grade}` : ""}
                                    </p>
                                    <p className="text-xs text-amber-800/80 dark:text-amber-200/75">
                                        Current mentor: {assignment.mentorName}
                                        {assignment.focus ? ` · ${assignment.focus}` : ""}
                                    </p>
                                </div>
                            </div>

                            {justReassignedId === assignment.assignmentId ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Reassigned
                                </span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedMentorByAssignment[assignment.assignmentId] || ""}
                                        disabled={!assignment.eligibleMentors.length}
                                        onChange={(event) =>
                                            setSelectedMentorByAssignment((prev) => ({
                                                ...prev,
                                                [assignment.assignmentId]: event.target.value,
                                            }))
                                        }
                                        className="rounded-full border border-amber-300/60 bg-white/90 px-3 py-1.5 text-sm text-slate-700 shadow-sm disabled:opacity-50 dark:border-amber-500/30 dark:bg-slate-900/60 dark:text-white"
                                    >
                                        <option value="">
                                            {assignment.eligibleMentors.length
                                                ? "Reassign to…"
                                                : "No mentor covers this grade yet"}
                                        </option>
                                        {assignment.eligibleMentors.map((mentor) => (
                                            <option key={mentor.id} value={mentor.id}>
                                                {mentor.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={!selectedMentorByAssignment[assignment.assignmentId] || savingId === assignment.assignmentId}
                                        onClick={() => handleReassign(assignment.assignmentId)}
                                        className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        {savingId === assignment.assignmentId ? "Saving…" : "Reassign"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

AdminReassignmentPanel.displayName = "AdminReassignmentPanel";

export default memo(AdminReassignmentPanel);
