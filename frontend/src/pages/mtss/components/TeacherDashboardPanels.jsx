import { memo, Suspense, lazy, useMemo } from "react";
import { TierPill, ProgressBadge } from "./StatusPills";

const DashboardOverview = lazy(() => import("./DashboardOverview"));
const StudentsPanel = lazy(() => import("./StudentsPanel"));
const InterventionFormPanel = lazy(() => import("./InterventionFormPanel"));
const EditInterventionPanel = lazy(() => import("./EditInterventionPanel"));
const ProgressFormPanel = lazy(() => import("./ProgressFormPanel"));

const PanelFallback = () => (
    <div className="glass glass-card p-8 text-center text-muted-foreground animate-pulse">Loading panel...</div>
);

const TeacherDashboardPanels = memo(
    ({
        activeTab,
        pilotGuide,
        statCards,
        students,
        progressData,
        interventionForm,
        progressForm,
        handleInterventionChange,
        handleProgressChange,
        handleSavePlan,
        handleProgressSubmitForm,
        baseFieldClass,
        textareaClass,
        notesTextareaClass,
        submittingPlan,
        submittingProgress,
        onViewStudent,
        onQuickUpdate,
        onEditPlan,
        canEditPlanForStudent,
        editingPlan,
        onCancelEditPlan,
        refresh,
    }) => {
        const panelContent = useMemo(() => {
            switch (activeTab) {
                case "dashboard":
                    return (
                        <DashboardOverview
                            statCards={statCards}
                            students={students}
                            progressData={progressData}
                            TierPill={TierPill}
                            ProgressBadge={ProgressBadge}
                            onView={onViewStudent}
                            onUpdate={onQuickUpdate}
                            onEditPlan={onEditPlan}
                            canEditPlanForStudent={canEditPlanForStudent}
                        />
                    );
                case "students":
                    return (
                        <StudentsPanel
                            students={students}
                            pilotGuide={pilotGuide}
                            TierPill={TierPill}
                            ProgressBadge={ProgressBadge}
                            onEditPlan={onEditPlan}
                            canEditPlanForStudent={canEditPlanForStudent}
                            onRefresh={refresh}
                        />
                    );
                case "create":
                    return (
                        <InterventionFormPanel
                            formState={interventionForm}
                            pilotGuide={pilotGuide}
                            onChange={handleInterventionChange}
                            onSubmit={(event) => handleSavePlan(event, interventionForm)}
                            baseFieldClass={baseFieldClass}
                            textareaClass={textareaClass}
                            students={students}
                            submitting={submittingPlan}
                        />
                    );
                case "edit":
                    return (
                        <EditInterventionPanel
                            formState={interventionForm}
                            onChange={handleInterventionChange}
                            onSubmit={(event) => handleSavePlan(event, interventionForm)}
                            baseFieldClass={baseFieldClass}
                            textareaClass={textareaClass}
                            students={students}
                            submitting={submittingPlan}
                            editingPlan={editingPlan}
                            onCancelEdit={onCancelEditPlan}
                        />
                    );
                case "submit":
                    return (
                        <ProgressFormPanel
                            formState={progressForm}
                            onChange={handleProgressChange}
                            onSubmit={handleProgressSubmitForm}
                            baseFieldClass={baseFieldClass}
                            textareaClass={notesTextareaClass}
                            students={students}
                            submitting={submittingProgress}
                        />
                    );
                default:
                    return null;
            }
        }, [
            activeTab,
            baseFieldClass,
            handleInterventionChange,
            handleProgressChange,
            handleProgressSubmitForm,
            handleSavePlan,
            canEditPlanForStudent,
            interventionForm,
            pilotGuide,
            notesTextareaClass,
            onCancelEditPlan,
            onEditPlan,
            onQuickUpdate,
            onViewStudent,
            progressData,
            progressForm,
            refresh,
            editingPlan,
            statCards,
            students,
            submittingPlan,
            submittingProgress,
            textareaClass,
        ]);

        return <Suspense fallback={<PanelFallback />}>{panelContent}</Suspense>;
    },
);

TeacherDashboardPanels.displayName = "TeacherDashboardPanels";
export default TeacherDashboardPanels;
