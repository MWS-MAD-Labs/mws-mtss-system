import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import * as mtss from "@/store/slices/mtssSlice";
import { validateInterventionForm } from "../config/interventionFormConfig";

export const useMtssIntervention = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();

    const students = useSelector(mtss.selectStudents);
    const studentsLoading = useSelector(mtss.selectStudentsLoading);
    const strategies = useSelector(mtss.selectStrategies);
    const strategiesLoading = useSelector(mtss.selectStrategiesLoading);
    const assignments = useSelector(mtss.selectAssignments);

    const interventionForm = useSelector(mtss.selectInterventionForm);
    const interventionSubmitting = useSelector(mtss.selectInterventionSubmitting);
    const interventionError = useSelector(mtss.selectInterventionError);
    const interventionSuccess = useSelector(mtss.selectInterventionSuccess);

    const progressForm = useSelector(mtss.selectProgressForm);
    const progressSubmitting = useSelector(mtss.selectProgressSubmitting);
    const progressError = useSelector(mtss.selectProgressError);
    const progressSuccess = useSelector(mtss.selectProgressSuccess);

    useEffect(() => {
        if (!students.length && !studentsLoading) dispatch(mtss.fetchStudents());
    }, [dispatch, students.length, studentsLoading]);

    useEffect(() => {
        const params = interventionForm.type ? { type: interventionForm.type } : {};
        dispatch(mtss.fetchMtssStrategies(params));
    }, [dispatch, interventionForm.type]);

    useEffect(() => {
        if (!assignments.length) dispatch(mtss.fetchAssignments());
    }, [dispatch, assignments.length]);

    useEffect(() => {
        if (interventionSuccess) {
            toast({
                title: "Intervention plan saved",
                description: "Student plan created successfully. Track their progress!",
            });
        }
        if (interventionError) {
            toast({
                title: "Failed to save plan",
                description: interventionError,
                variant: "destructive",
            });
            dispatch(mtss.clearInterventionError());
        }
    }, [dispatch, interventionError, interventionSuccess, toast]);

    useEffect(() => {
        if (progressSuccess) {
            toast({
                title: "Progress submitted",
                description: "Your monitoring update is live on the MTSS dashboard.",
            });
        }
        if (progressError) {
            toast({
                title: "Failed to submit progress",
                description: progressError,
                variant: "destructive",
            });
            dispatch(mtss.clearProgressError());
        }
    }, [dispatch, progressError, progressSuccess, toast]);

    const handleInterventionChange = useCallback((field, value) => {
        dispatch(mtss.updateInterventionForm({ field, value }));

        if (field !== "strategyId" || !value) return;
        const strategy = strategies.find((item) => item._id === value);
        if (!strategy) return;

        dispatch(mtss.updateInterventionForm({ field: "strategyName", value: strategy.name }));
        if (!interventionForm.goal && strategy.overview) {
            dispatch(mtss.updateInterventionForm({ field: "goal", value: strategy.overview }));
        }
    }, [dispatch, interventionForm.goal, strategies]);

    const handleProgressChange = useCallback((field, value) => {
        dispatch(mtss.updateProgressForm({ field, value }));
    }, [dispatch]);

    const handleStudentSelect = useCallback((studentId) => {
        const student = students.find((s) => s.id === studentId || s._id === studentId);
        if (student) dispatch(mtss.prefillInterventionFromStudent(student));
    }, [dispatch, students]);

    const handleSavePlan = useCallback((event) => {
        event?.preventDefault?.();
        if (interventionSubmitting) return;

        if (!validateInterventionForm(interventionForm)) {
            toast({
                title: "Complete the required fields",
                description: "Student, type, tier, start date, frequency, and method are required.",
                variant: "destructive",
            });
            return;
        }

        dispatch(mtss.createInterventionPlan(interventionForm));
    }, [dispatch, interventionForm, interventionSubmitting, toast]);

    const handleSubmitProgress = useCallback((event) => {
        event?.preventDefault?.();
        if (progressSubmitting) return;

        if (!progressForm.assignmentId || !progressForm.summary) {
            toast({
                title: "Complete the required fields",
                description: "Please select a student and provide a progress summary.",
                variant: "destructive",
            });
            return;
        }

        dispatch(mtss.submitProgressUpdate(progressForm));
    }, [dispatch, progressForm, progressSubmitting, toast]);

    const handleResetInterventionForm = useCallback(() => {
        dispatch(mtss.resetInterventionForm());
    }, [dispatch]);

    const handleResetProgressForm = useCallback(() => {
        dispatch(mtss.resetProgressForm());
    }, [dispatch]);

    const refreshStudents = useCallback(() => {
        dispatch(mtss.fetchStudents());
    }, [dispatch]);

    return {
        students,
        studentsLoading,
        strategies,
        strategiesLoading,
        assignments,
        interventionForm,
        interventionSubmitting,
        interventionSuccess,
        handleInterventionChange,
        handleSavePlan,
        handleResetInterventionForm,
        handleStudentSelect,
        progressForm,
        progressSubmitting,
        progressSuccess,
        handleProgressChange,
        handleSubmitProgress,
        handleResetProgressForm,
        refreshStudents,
    };
};

export default useMtssIntervention;
