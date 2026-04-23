import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { createMentorAssignment } from "@/services/mtssService";

const KEYWORDS = ["teacher", "homeroom", "subject", "special"];
const tierOptions = [
    { label: "Tier 2 - Targeted", value: "tier2" },
    { label: "Tier 3 - Intensive", value: "tier3" },
];

const AdminAssignmentModal = ({ open, onClose, students = [], mentors = [], onAssigned }) => {
    const { toast } = useToast();

    const teacherMentors = useMemo(() => {
        const isTeacherProfile = (mentor) => {
            const jobPosition = (mentor?.jobPosition || "").toLowerCase();
            const role = (mentor?.role || "").toLowerCase();
            const classRole = Array.isArray(mentor?.classes)
                ? mentor.classes.some((cls) => (cls.role || "").toLowerCase().includes("teacher"))
                : false;
            return KEYWORDS.some((keyword) => jobPosition.includes(keyword)) || classRole || role.includes("teacher");
        };
        return mentors.filter(isTeacherProfile);
    }, [mentors]);

    const availableMentors = teacherMentors.length > 0 ? teacherMentors : mentors;

    const [tier, setTier] = useState("tier2");
    const [mentorId, setMentorId] = useState(() => availableMentors?.[0]?._id || "");
    const [focusInput, setFocusInput] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const studentIds = useMemo(() => students.map((student) => student.id || student._id), [students]);
    const disableSubmit = studentIds.length < 2 || !mentorId || submitting;

    useEffect(() => {
        if (!availableMentors?.length) {
            setMentorId("");
            return;
        }
        const exists = availableMentors.some((mentor) => mentor._id === mentorId);
        if (!exists) {
            setMentorId(availableMentors[0]._id);
        }
    }, [availableMentors, mentorId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (disableSubmit) return;
        setSubmitting(true);
        try {
            const focusAreas = focusInput
                ? focusInput.split(",").map((item) => item.trim()).filter(Boolean)
                : ["Targeted Support"];
            await createMentorAssignment({
                mentorId,
                studentIds,
                tier,
                focusAreas,
                notes,
            });
            toast({
                title: "Assignment created",
                description: "Selected students were assigned to the mentor.",
            });
            onAssigned?.();
        } catch (err) {
            toast({
                title: "Failed to assign",
                description: err?.response?.data?.message || err.message || "Unable to create mentor assignment",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose?.()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Assign selected students</DialogTitle>
                    <DialogDescription>
                        Create a new MTSS assignment for <strong>{students.length}</strong> students. Select a tier and mentor to continue.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Students</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {students.map((student) => (
                                <span key={student.id} className="px-3 py-1 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    {student.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
                            <span>Tier</span>
                            <select
                                value={tier}
                                onChange={(event) => setTier(event.target.value)}
                                className="w-full rounded-2xl border border-border/60 bg-white/80 dark:bg-white/10 px-4 py-3"
                            >
                                {tierOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
                            <span>Mentor</span>
                            <select
                                value={mentorId}
                                onChange={(event) => setMentorId(event.target.value)}
                                className="w-full rounded-2xl border border-border/60 bg-white/80 dark:bg-white/10 px-4 py-3"
                                disabled={!availableMentors.length}
                            >
                                {availableMentors.length === 0 ? (
                                    <option value="">No teaching mentors available</option>
                                ) : (
                                    availableMentors.map((mentor) => (
                                        <option key={mentor._id} value={mentor._id}>
                                            {mentor.name} · {mentor.jobPosition || mentor.role || "Teacher"}
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>
                    </div>

                    <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
                        <span>Focus areas (comma separated)</span>
                        <input
                            value={focusInput}
                            onChange={(event) => setFocusInput(event.target.value)}
                            placeholder="Fluency boost, SEL routines"
                            className="w-full rounded-2xl border border-border/60 bg-white/80 dark:bg-white/10 px-4 py-3"
                        />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
                        <span>Notes</span>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Add optional context for the mentor…"
                            className="w-full h-24 rounded-2xl border border-border/60 bg-white/80 dark:bg-white/10 px-4 py-3 resize-none"
                        />
                    </label>

                    <DialogFooter className="pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-full border border-border/60 text-sm font-semibold text-foreground dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={disableSubmit}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white ${
                                disableSubmit
                                    ? "bg-muted cursor-not-allowed opacity-60"
                                    : "bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] shadow hover:-translate-y-0.5 transition"
                            }`}
                        >
                            {submitting ? "Assigning…" : "Create assignment"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

AdminAssignmentModal.displayName = "AdminAssignmentModal";
export default AdminAssignmentModal;
