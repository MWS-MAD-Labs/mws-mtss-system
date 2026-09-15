import { memo, useEffect, useMemo, useCallback, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { ArrowLeft } from "lucide-react";
import { glassStyles } from "./config/studentProfileConfig";
import StudentProfileHeader from "./components/StudentProfileHeader";
import QuickFactsGrid from "./components/QuickFactsGrid";
import GrowthJourneySection from "./components/GrowthJourneySection";
import StudentInterventionsSection from "./components/StudentInterventionsSection";
import StudentNoInterventionFallback from "./components/StudentNoInterventionFallback";
import { StudentProfileLoading, StudentProfileError } from "./components/StudentProfileStates";
import useStudentProfileData from "./hooks/useStudentProfileData";
import { buildStudentProfileView } from "./utils/studentProfileUtils";
import { updateMentorAssignment } from "@/services/mtssService";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const StudentProfilePage = memo(() => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);
    const { student, loading, error, selectedIntervention, setSelectedIntervention, refresh } = useStudentProfileData(slug);

    useEffect(() => {
        AOS.init({
            duration: 600,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
            delay: 0,
        });
    }, []);

    useEffect(() => {
        if (student) {
            setTimeout(() => AOS.refresh(), 100);
        }
    }, [student]);

    const handleSelectIntervention = useCallback((intervention) => {
        setSelectedIntervention(intervention);
    }, [setSelectedIntervention]);

    const handleBack = useCallback(() => {
        const fromPath = location.state?.from?.pathname;
        const fromSearch = location.state?.from?.search || "";

        if (fromPath) {
            navigate(`${fromPath}${fromSearch}`);
            return;
        }

        if (window.history.length > 2) {
            navigate(-1);
            return;
        }

        navigate("/mtss/teacher?tab=students");
    }, [location.state, navigate]);

    const {
        profile,
        highlight,
        sortedInterventions,
        currentIntervention,
        strategyLabel,
        durationLabel,
        frequencyLabel,
        mentorLabel,
        pairingLabel,
        goalLabel,
        monitoringMethodLabel,
        startDateLabel,
        notesLabel,
    } = useMemo(
        () => buildStudentProfileView(student, selectedIntervention),
        [student, selectedIntervention],
    );
    const normalizedStatus = String(currentIntervention?.status || "active").toLowerCase();
    const canEditCurrentIntervention = currentIntervention?.viewerCanEditPlan === true
        || currentIntervention?.viewerPermissions?.canEditPlan === true;
    const statusActionKind = normalizedStatus === "closed"
        ? "reopen"
        : (["active", "paused"].includes(normalizedStatus) ? "cancel" : null);
    const statusAction = canEditCurrentIntervention && currentIntervention?.assignmentId && statusActionKind
        ? {
            kind: statusActionKind,
            label: statusActionKind === "reopen" ? "Reopen Intervention" : "Cancel Intervention",
            disabled: savingStatus,
            onClick: () => setStatusDialogOpen(true),
        }
        : null;

    const handleStatusChange = useCallback(async () => {
        if (!currentIntervention?.assignmentId || !statusActionKind || savingStatus) return;
        const nextStatus = statusActionKind === "reopen" ? "active" : "closed";
        try {
            setSavingStatus(true);
            await updateMentorAssignment(currentIntervention.assignmentId, { status: nextStatus });
            await refresh();
            setStatusDialogOpen(false);
            toast({
                title: nextStatus === "closed" ? "Intervention canceled" : "Intervention reopened",
                description: nextStatus === "closed"
                    ? "The plan is closed. Goals, evidence, and progress history are still retained."
                    : "The plan is active again and can receive progress updates.",
            });
        } catch (statusError) {
            toast({
                title: "Unable to update intervention",
                description: statusError?.response?.data?.message || statusError?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setSavingStatus(false);
        }
    }, [currentIntervention, refresh, savingStatus, statusActionKind, toast]);

    if (loading) {
        return <StudentProfileLoading />;
    }

    if (error || !student) {
        return <StudentProfileError error={error} onBack={handleBack} />;
    }

    return (
        <div className="relative min-h-screen mtss-theme bg-gradient-to-br from-slate-50 via-white to-rose-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/20">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 hidden sm:block mtss-animated-bg opacity-70" />
                <div className="absolute -top-32 -left-32 hidden sm:block w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/4 -right-32 hidden sm:block w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 left-1/4 hidden sm:block w-72 h-72 bg-gradient-to-br from-amber-400/15 to-orange-400/15 dark:from-amber-600/10 dark:to-orange-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 container max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-8 space-y-2 sm:space-y-6">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleBack}
                    className={`${glassStyles.card} ${glassStyles.hover} inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold shadow-lg`}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Students</span>
                    <span className="sm:hidden">Back</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`${glassStyles.card} rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl`}
                >
                    <StudentProfileHeader
                        student={student}
                        highlight={highlight}
                        currentTier={currentIntervention?.tier}
                        currentInterventionLabel={currentIntervention?.label}
                    />

                    <div className="p-2 sm:p-6 lg:p-8 space-y-2.5 sm:space-y-6">
                        <QuickFactsGrid student={student} profile={profile} mentorLabel={mentorLabel} />

                        <StudentInterventionsSection
                            sortedInterventions={sortedInterventions}
                            selectedIntervention={selectedIntervention}
                            onSelect={handleSelectIntervention}
                            glassStyles={glassStyles}
                        />

                        <AnimatePresence mode="wait">
                            {currentIntervention && (
                                <GrowthJourneySection
                                    intervention={currentIntervention}
                                    strategyLabel={strategyLabel}
                                    durationLabel={durationLabel}
                                    frequencyLabel={frequencyLabel}
                                    mentorLabel={mentorLabel}
                                    pairingLabel={pairingLabel}
                                    goalLabel={goalLabel}
                                    monitoringMethodLabel={monitoringMethodLabel}
                                    startDateLabel={startDateLabel}
                                    notesLabel={notesLabel}
                                    statusAction={statusAction}
                                />
                            )}
                        </AnimatePresence>

                        {!currentIntervention && sortedInterventions.length === 0 && (
                            <StudentNoInterventionFallback glassStyles={glassStyles} />
                        )}
                    </div>
                </motion.div>
            </div>
            <Dialog open={statusDialogOpen} onOpenChange={(open) => !savingStatus && setStatusDialogOpen(open)}>
                <DialogContent className="mx-4 max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {statusActionKind === "reopen" ? "Reopen this intervention?" : "Cancel this intervention?"}
                        </DialogTitle>
                        <DialogDescription>
                            {statusActionKind === "reopen"
                                ? `This will make ${currentIntervention?.label || "the intervention"} active again and allow new progress updates. Existing history remains unchanged.`
                                : `This will close ${currentIntervention?.label || "the intervention"} for ${student?.name || "this student"}. Goals, evidence, and progress history will be retained, but no new progress can be submitted until it is reopened.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <button
                            type="button"
                            onClick={() => setStatusDialogOpen(false)}
                            disabled={savingStatus}
                            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
                        >
                            {statusActionKind === "reopen" ? "Keep Closed" : "Keep Intervention"}
                        </button>
                        <button
                            type="button"
                            onClick={handleStatusChange}
                            disabled={savingStatus}
                            className={`rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${statusActionKind === "reopen" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                        >
                            {savingStatus ? "Saving..." : (statusActionKind === "reopen" ? "Reopen Intervention" : "Cancel Intervention")}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

StudentProfilePage.displayName = "StudentProfilePage";
export default StudentProfilePage;
