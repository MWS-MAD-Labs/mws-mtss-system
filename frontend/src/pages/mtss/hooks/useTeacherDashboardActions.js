import { useCallback } from "react";
import { updateMentorAssignment, uploadEvidenceAttachments } from "@/services/mtssService";
import { canUserSubmitProgressForAssignment } from "../utils/editPlanAccess";

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);
const isLateProgressDate = (dateValue) => Boolean(dateValue && dateValue < getTodayInputValue());

const useTeacherDashboardActions = ({
    students,
    progressForm,
    resetProgressForm,
    refresh,
    setSubmittingProgress,
    toast,
    setSavingQuickUpdate,
    setUploadProgress,
    onCloseQuickUpdate,
}) => {
    const handleProgressSubmitForm = useCallback(
        async (event, evidenceFiles = [], resetEvidenceFiles) => {
            event?.preventDefault?.();
            if (!progressForm.studentId || !progressForm.date || progressForm.scoreValue === "") {
                toast({
                    title: "Complete the required fields",
                    description: "Student, date, and score are required to submit progress.",
                    variant: "destructive",
                });
                return;
            }
                if (
                    progressForm.performed !== "yes" &&
                    (!progressForm.skipReason || (progressForm.skipReason === "other" && !progressForm.skipReasonNote?.trim()))
                ) {
                toast({
                    title: "Skip reason required",
                    description: "Choose why this intervention was skipped before saving the update.",
                    variant: "destructive",
                });
                    return;
                }
            if (isLateProgressDate(progressForm.date) && !progressForm.lateReason?.trim()) {
                toast({
                    title: "Late reason required",
                    description: "Add why this progress update is being submitted after the support date.",
                    variant: "destructive",
                });
                return;
            }
            const selectedStudent = students.find((student) => student.id === progressForm.studentId);
            if (!selectedStudent) {
                toast({
                    title: "Select a student",
                    description: "Choose a student before logging progress.",
                    variant: "destructive",
                });
                return;
            }
            const assignmentId = progressForm.assignmentId || selectedStudent.assignmentId;
            if (!assignmentId) {
                toast({
                    title: "No active intervention",
                    description: `${selectedStudent.name} is not linked to an active intervention yet.`,
                    variant: "destructive",
                });
                return;
            }
            const selectedOption = Array.isArray(selectedStudent.assignmentOptions)
                ? selectedStudent.assignmentOptions.find((option) => option?.assignmentId === assignmentId)
                : null;
            if (!canUserSubmitProgressForAssignment(selectedOption)) {
                toast({
                    title: "Progress permission denied",
                    description: "You can only submit progress for subjects assigned to you.",
                    variant: "destructive",
                });
                return;
            }
            try {
                const trimmedNotes = progressForm.notes?.trim() || "";
                const parsedScoreValue = progressForm.scoreValue !== "" ? Number(progressForm.scoreValue) : undefined;
                setSubmittingProgress(true);
                const evidencePayload = await uploadEvidenceAttachments(evidenceFiles);
                await updateMentorAssignment(assignmentId, {
                    checkIns: [
                        {
                            date: progressForm.date || new Date(),
                            summary: trimmedNotes || "Progress update logged via dashboard",
                            nextSteps: trimmedNotes || undefined,
                            value: Number.isFinite(parsedScoreValue) ? parsedScoreValue : undefined,
                            unit: progressForm.scoreUnit,
                                performed: progressForm.performed === "yes",
                                skipReason: progressForm.performed !== "yes" ? (progressForm.skipReason || undefined) : undefined,
                                skipReasonNote: progressForm.performed !== "yes" && progressForm.skipReason === "other" ? (progressForm.skipReasonNote || undefined) : undefined,
                                lateReason: isLateProgressDate(progressForm.date) ? (progressForm.lateReason?.trim() || undefined) : undefined,
                                evidence: evidencePayload?.length ? evidencePayload : undefined,
                        },
                    ],
                });
                toast({
                    title: "Progress saved",
                    description: evidencePayload?.length
                        ? `${selectedStudent.name}'s update is now on the dashboard with ${evidencePayload.length} evidence file${evidencePayload.length === 1 ? "" : "s"}.`
                        : `${selectedStudent.name}'s update is now on the dashboard.`,
                });
                resetProgressForm();
                resetEvidenceFiles?.();
                refresh();
            } catch (error) {
                toast({
                    title: "Failed to save progress",
                    description: error?.response?.data?.message || error.message || "Unable to record update now.",
                    variant: "destructive",
                });
            } finally {
                setSubmittingProgress(false);
            }
        },
        [progressForm, students, toast, resetProgressForm, refresh, setSubmittingProgress],
    );

    const handleQuickUpdateSubmit = useCallback(
        async (student, formState, evidenceFiles = []) => {
            const assignmentId = formState?.assignmentId || student?.assignmentId;
            if (!assignmentId) {
                toast({
                    title: "No active intervention",
                    description: `${student?.name || "Student"} isn't linked to an active intervention yet.`,
                    variant: "destructive",
                });
                return;
            }
            const selectedOption = Array.isArray(student?.assignmentOptions)
                ? student.assignmentOptions.find((option) => option?.assignmentId === assignmentId)
                : null;
                if (
                    formState.performed !== "yes" &&
                    (!formState.skipReason || (formState.skipReason === "other" && !formState.skipReasonNote?.trim()))
                ) {
                toast({
                    title: "Skip reason required",
                    description: "Choose why this intervention was skipped before saving the update.",
                    variant: "destructive",
                });
                    return;
                }
            if (isLateProgressDate(formState.date) && !formState.lateReason?.trim()) {
                toast({
                    title: "Late reason required",
                    description: "Add why this progress update is being submitted after the support date.",
                    variant: "destructive",
                });
                return;
            }
            if (!canUserSubmitProgressForAssignment(selectedOption)) {
                toast({
                    title: "Progress permission denied",
                    description: "You can only submit progress for subjects assigned to you.",
                    variant: "destructive",
                });
                return;
            }
            setSavingQuickUpdate(true);
            setUploadProgress?.(0);
            try {
                const evidencePayload = await uploadEvidenceAttachments(evidenceFiles, setUploadProgress);

                const trimmedNotes = formState.notes?.trim() || "";
                const parsedScoreValue = formState.scoreValue !== "" ? Number(formState.scoreValue) : undefined;

                await updateMentorAssignment(assignmentId, {
                    checkIns: [
                        {
                            date: formState.date,
                            summary: trimmedNotes || "Quick update",
                            nextSteps: trimmedNotes || undefined,
                            value: Number.isFinite(parsedScoreValue) ? parsedScoreValue : undefined,
                            unit: formState.scoreUnit,
                                performed: formState.performed === "yes",
                                skipReason: formState.performed !== "yes" ? (formState.skipReason || undefined) : undefined,
                                skipReasonNote: formState.performed !== "yes" && formState.skipReason === "other" ? (formState.skipReasonNote || undefined) : undefined,
                                lateReason: isLateProgressDate(formState.date) ? (formState.lateReason?.trim() || undefined) : undefined,
                                celebration: formState.badge || undefined,
                            evidence: evidencePayload?.length ? evidencePayload : undefined,
                        },
                    ],
                });
                toast({
                    title: "Progress update saved",
                    description: evidencePayload?.length
                        ? `${student.name}'s update was recorded with ${evidencePayload.length} evidence file${evidencePayload.length === 1 ? "" : "s"}.`
                        : `${student.name}'s update was recorded!`,
                });
                onCloseQuickUpdate();
                refresh();
            } catch (error) {
                toast({
                    title: "Failed to save update",
                    description: error?.response?.data?.message || error.message || "Please try again in a moment.",
                    variant: "destructive",
                });
            } finally {
                setSavingQuickUpdate(false);
                setUploadProgress?.(0);
            }
        },
        [toast, onCloseQuickUpdate, refresh, setSavingQuickUpdate, setUploadProgress],
    );

    return { handleProgressSubmitForm, handleQuickUpdateSubmit };
};

export default useTeacherDashboardActions;
