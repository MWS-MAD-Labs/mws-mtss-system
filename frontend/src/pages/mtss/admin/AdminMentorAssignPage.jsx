import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createMentorAssignment, fetchMtssMentors, fetchMtssStudents } from "@/services/mtssService";
import { useToast } from "@/components/ui/use-toast";
import { deriveTeacherSegments, normalizeGradeLabel } from "@/pages/mtss/utils/teacherDashboardUtils";
import { STUDENT_LIMIT, tierOptions } from "./config/mentorAssignConfig";
import MentorAssignHeader from "./components/MentorAssignHeader";
import MentorAssignForm from "./components/MentorAssignForm";
import { MentorAssignError, MentorAssignLoading } from "./components/MentorAssignState";
import StudentSelectionList from "./components/StudentSelectionList";

const AdminMentorAssignPage = () => {
    const { mentorId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [mentor, setMentor] = useState(() => location.state?.mentor || null);
    const [students, setStudents] = useState([]);
    const [tier, setTier] = useState("tier2");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [focusInput, setFocusInput] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
        setSelectedIds([]);
        setSearch("");
        setFocusInput("");
        setNotes("");
        setTier("tier2");
        setVisibleCount(10);
    }, [mentorId]);

    useEffect(() => {
        if (location.state?.mentor) setMentor(location.state.mentor);
    }, [location.state]);

    useEffect(() => {
        let ignore = false;
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [mentorResponse, studentResponse] = await Promise.all([
                    fetchMtssMentors(),
                    fetchMtssStudents({ limit: STUDENT_LIMIT }),
                ]);
                if (ignore) return;

                const resolvedMentor =
                    (mentorResponse?.mentors || []).find((item) => {
                        const key = (item._id || item.id || "").toString();
                        return key === mentorId;
                    }) || location.state?.mentor || null;

                if (!resolvedMentor) {
                    setError("Mentor not found or not registered.");
                } else {
                    setMentor(resolvedMentor);
                }

                const roster = (studentResponse?.students || [])
                    .slice()
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                setStudents(roster);
            } catch (err) {
                if (ignore) return;
                setError(err?.response?.data?.message || err.message || "Failed to load MTSS data.");
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        loadData();
        return () => { ignore = true; };
    }, [mentorId, location.state]);

    const mentorSegments = useMemo(() => deriveTeacherSegments(mentor || {}), [mentor]);

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();
        return students.filter((student) => {
            const gradeLabel = normalizeGradeLabel(student.grade || student.currentGrade || student.className || student.type || "");
            const matchesGrade = !mentorSegments.allowedGrades.length || mentorSegments.allowedGrades.includes(gradeLabel);
            if (!matchesGrade) return false;
            if (!query) return true;
            const name = student.name?.toLowerCase() || "";
            const grade = gradeLabel.toLowerCase();
            const cls = (student.className || "").toLowerCase();
            return name.includes(query) || grade.includes(query) || cls.includes(query);
        });
    }, [students, search, mentorSegments.allowedGrades]);

    const visibleStudents = useMemo(() => filteredStudents.slice(0, visibleCount), [filteredStudents, visibleCount]);
    const selectedStudents = useMemo(() => students.filter((s) => selectedIds.includes(s.id || s._id)), [students, selectedIds]);

    const toggleSelection = (studentId) => {
        setSelectedIds((prev) => prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!mentor?._id) {
            toast({ title: "Mentor not ready", description: "We could not find mentor data for this assignment.", variant: "destructive" });
            return;
        }
        if (selectedIds.length < 2) {
            toast({ title: "Select at least two students", description: "MTSS Tier 2 thrives on tight-knit groups, so add another student.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const focusAreas = focusInput ? focusInput.split(",").map((item) => item.trim()).filter(Boolean) : [];
            await createMentorAssignment({ mentorId: mentor._id, studentIds: selectedIds, tier, focusAreas, notes: notes.trim() });
            toast({ title: "New caseload created", description: `Paired ${mentor.name} with ${selectedIds.length} students.` });
            navigate("/mtss/admin");
        } catch (err) {
            toast({ title: "Failed to save assignment", description: err?.response?.data?.message || err.message || "A server error occurred.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <MentorAssignLoading />;
    }

    if (error || !mentor) {
        return <MentorAssignError error={error} onBack={() => navigate("/mtss/admin")} />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden px-4 py-8 sm:px-6 lg:px-10 bg-gradient-to-br from-[#dbeafe] via-[#fdf2f8] to-[#fef9c3] dark:from-[#0f172a] dark:via-[#111827] dark:to-[#1e1b4b]">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 left-4 w-64 h-64 bg-[#a5b4fc]/30 blur-[160px]" />
                <div className="absolute top-10 right-10 w-72 h-72 bg-[#f472b6]/25 blur-[180px]" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#fde68a]/30 blur-[180px]" />
            </div>
            <div className="relative z-10">
                <div className="max-w-5xl mx-auto space-y-8" data-aos="fade-up" data-aos-delay="120">
                    <button type="button" onClick={() => navigate("/mtss/admin")} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d8b4fe]/90 via-[#fbcfe8]/90 to-[#fde68a]/90 dark:from-[#312e81]/80 dark:via-[#4c1d95]/80 dark:to-[#083344]/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white shadow-lg shadow-rose-200/40 dark:shadow-none hover:-translate-y-0.5 transition duration-300" data-aos="fade-right">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Mentor Squad
                    </button>

                    <div className="relative overflow-hidden rounded-[34px] border border-white/40 dark:border-white/10 bg-gradient-to-br from-white/95 via-white/70 to-white/40 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/45 shadow-[0_35px_120px_rgba(15,23,42,0.35)] backdrop-blur-3xl p-6 sm:p-10 space-y-8">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-16 -right-12 w-56 h-56 bg-gradient-to-br from-[#f472b6]/40 via-[#fcd34d]/30 to-transparent blur-3xl" />
                            <div className="absolute -bottom-10 left-8 w-48 h-48 bg-gradient-to-br from-[#22d3ee]/35 via-transparent to-transparent blur-3xl" />
                        </div>

                        <MentorAssignHeader
                            mentor={mentor}
                            tier={tier}
                            tierOptions={tierOptions}
                            focusInput={focusInput}
                            selectedCount={selectedIds.length}
                            mentorSegments={mentorSegments}
                        />

                        <MentorAssignForm
                            tier={tier}
                            tierOptions={tierOptions}
                            focusInput={focusInput}
                            notes={notes}
                            selectedStudents={selectedStudents}
                            selectedIds={selectedIds}
                            submitting={submitting}
                            onTierChange={setTier}
                            onFocusChange={setFocusInput}
                            onNotesChange={setNotes}
                            onCancel={() => navigate("/mtss/admin")}
                            onSubmit={handleSubmit}
                        >
                            <StudentSelectionList
                                students={students}
                                visibleStudents={visibleStudents}
                                filteredStudents={filteredStudents}
                                selectedIds={selectedIds}
                                search={search}
                                onSearchChange={setSearch}
                                onToggleSelection={toggleSelection}
                                onLoadMore={() => setVisibleCount((prev) => prev + 10)}
                            />
                        </MentorAssignForm>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMentorAssignPage;
