import { memo, useMemo, useState } from "react";
import { MessageCircleHeart, Sparkles } from "lucide-react";
import { buildStudentProfileView } from "../utils/studentProfileUtils";
import { formatMentorDisplay } from "../utils/mentorNameUtils";
import EvidenceViewer from "../components/EvidenceViewer";

const toTimestamp = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const StudentMessagesPanel = ({ student, isLoading = false }) => {
    const sortedInterventions = useMemo(() => {
        if (!student) return [];
        return buildStudentProfileView(student).sortedInterventions || [];
    }, [student]);

    const interventions = useMemo(() => {
        const withRealData = sortedInterventions.filter((item) => item.hasRealData);
        return withRealData.length ? withRealData : sortedInterventions;
    }, [sortedInterventions]);

    const subjects = useMemo(
        () => interventions.map((intervention) => ({
            type: intervention.type,
            label: intervention.label || intervention.type || "Intervention",
        })),
        [interventions],
    );
    const [selectedSubject, setSelectedSubject] = useState("all");

    const feed = useMemo(() => {
        const entries = interventions.flatMap((intervention) => {
            const mentor = formatMentorDisplay({
                name: intervention.mentor,
                nickname: intervention.mentorNickname,
                username: intervention.mentorUsername,
                gender: intervention.mentorGender,
            });
            const subject = intervention.label || intervention.type || "Intervention";
            const list = [];

            if (intervention.notes) {
                list.push({
                    id: `${intervention.type || subject}-notes`,
                    subjectType: intervention.type,
                    subject,
                    from: mentor || "MTSS Mentor",
                    date: "Latest Plan Note",
                    dateRaw: intervention.updatedAt || intervention.endDate || intervention.startDate || null,
                    text: intervention.notes,
                    score: null,
                    evidence: [],
                });
            }

            if (Array.isArray(intervention.history)) {
                intervention.history.forEach((entry, index) => {
                    if (!entry) return;
                    list.push({
                        id: `${intervention.type || subject}-${entry.date || "recent"}-${index}`,
                        subjectType: intervention.type,
                        subject,
                        from: mentor || "MTSS Mentor",
                        date: entry.date || "Recent",
                        dateRaw: entry.dateRaw || entry.createdAt || entry.date,
                        text: entry.summary || entry.notes || entry.observation || "Check-in recorded",
                        score: entry.score,
                        evidence: Array.isArray(entry.evidence) ? entry.evidence : [],
                        nextSteps: entry.nextSteps || entry.nextStep || null,
                    });
                });
            }

            return list;
        });

        return entries.sort((a, b) => toTimestamp(b.dateRaw || b.date) - toTimestamp(a.dateRaw || a.date));
    }, [interventions]);

    const filteredFeed = useMemo(
        () => (selectedSubject === "all" ? feed : feed.filter((entry) => entry.subjectType === selectedSubject)),
        [feed, selectedSubject],
    );

    if (isLoading) {
        return (
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center text-sm text-slate-700 shadow-sm dark:border-white/20 dark:bg-slate-900/82 dark:text-slate-200">
                Loading mentor updates...
            </div>
        );
    }

    if (!student) {
        return (
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center text-sm text-slate-700 shadow-sm dark:border-white/20 dark:bg-slate-900/82 dark:text-slate-200">
                No communication data available.
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(236,72,153,0.1)] backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/82">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-600 dark:text-slate-200">Mentor Updates</p>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">All Subject Communication Log</h3>
                    </div>
                    <MessageCircleHeart className="h-5 w-5 text-pink-600 dark:text-pink-200" />
                </div>

                {subjects.length > 1 && (
                    <div className="mb-4 no-scrollbar flex gap-2 overflow-x-auto pb-1">
                        <button
                            type="button"
                            onClick={() => setSelectedSubject("all")}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                selectedSubject === "all"
                                    ? "border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-300/55 dark:bg-violet-900/55 dark:text-violet-100"
                                    : "border-white/80 bg-white/92 text-slate-700 dark:border-white/20 dark:bg-slate-800/72 dark:text-slate-200"
                            }`}
                        >
                            All Subjects
                        </button>
                        {subjects.map((subject) => (
                            <button
                                key={subject.type}
                                type="button"
                                onClick={() => setSelectedSubject(subject.type)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                    selectedSubject === subject.type
                                        ? "border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-300/55 dark:bg-violet-900/55 dark:text-violet-100"
                                        : "border-white/80 bg-white/92 text-slate-700 dark:border-white/20 dark:bg-slate-800/72 dark:text-slate-200"
                                }`}
                            >
                                {subject.label}
                            </button>
                        ))}
                    </div>
                )}

                {filteredFeed.length > 0 ? (
                    <div className="space-y-3">
                        {filteredFeed.map((message) => (
                            <div
                                key={message.id}
                                className="rounded-2xl border border-white/80 bg-gradient-to-r from-sky-50 via-violet-50 to-pink-50 px-4 py-3 shadow-sm dark:border-white/20 dark:from-sky-950/70 dark:via-violet-950/70 dark:to-pink-950/60"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-violet-700 dark:text-violet-100">{message.subject}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-200">{message.date}</p>
                                </div>
                                <p className="text-sm font-black text-indigo-700 dark:text-indigo-100">{message.from}</p>
                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-100">{message.text}</p>
                                {message.nextSteps && (
                                    <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                        Next steps: {message.nextSteps}
                                    </p>
                                )}
                                {message.score !== undefined && message.score !== null && (
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-200">Score: {message.score}</p>
                                )}
                                {message.evidence?.length > 0 && (
                                    <div className="mt-2">
                                        <EvidenceViewer evidence={message.evidence} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/80 bg-gradient-to-r from-sky-50 via-violet-50 to-pink-50 px-4 py-3 text-sm text-slate-700 dark:border-white/20 dark:from-sky-950/70 dark:via-violet-950/70 dark:to-pink-950/60 dark:text-slate-200">
                        No communication notes for this subject yet.
                    </div>
                )}

                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Read-only for students. Ask your mentor or homeroom teacher for direct follow-up.
                </div>
            </div>
        </div>
    );
};

StudentMessagesPanel.displayName = "StudentMessagesPanel";
export default memo(StudentMessagesPanel);
