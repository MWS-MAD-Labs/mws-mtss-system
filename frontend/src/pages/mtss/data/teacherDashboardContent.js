import {
    LineChart as LineChartIcon,
    PencilLine,
    PlusCircle,
    Users2,
} from "lucide-react";

export const tabs = [
    { key: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LineChartIcon },
    { key: "students", label: "My Students", shortLabel: "Students", icon: Users2 },
    { key: "create", label: "Create Intervention", shortLabel: "Create", icon: PlusCircle },
    { key: "edit", label: "Edit Intervention", shortLabel: "Edit", icon: PencilLine },
];

export const fieldClasses = {
    base: "px-4 py-3 rounded-2xl bg-white/80 dark:bg-white/10 border border-primary/20 text-sm text-foreground dark:text-white placeholder:text-muted-foreground/70 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all",
};

fieldClasses.textarea = `${fieldClasses.base} min-h-[80px]`;
fieldClasses.notes = `${fieldClasses.base} min-h-[120px]`;

export const createDefaultInterventionForm = () => ({
    studentId: "",
    studentName: "",
    grade: "",
    className: "",
    mode: "quantitative",
    type: "",
    strategyId: "",
    strategyName: "",
    tier: "tier2",
    goal: "",
    notes: "",
    startDate: "",
    duration: "",
    monitorFrequency: "",
    customFrequencyDays: [],
    customFrequencyNote: "",
    monitorMethod: "",
    baselineValue: "",
    baselineUnit: "score",
    targetValue: "",
    targetUnit: "score",
});

export const createDefaultProgressForm = () => ({
    studentId: "",
    assignmentId: "",
    studentName: "",
    date: "",
        performed: "yes",
        skipReason: "",
        skipReasonNote: "",
        lateReason: "",
        scoreValue: "",
    scoreUnit: "score",
     badge: "🎉 Progress Party",
    notes: "",
});
