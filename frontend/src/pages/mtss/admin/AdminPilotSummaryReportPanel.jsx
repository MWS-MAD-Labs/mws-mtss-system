import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Download,
    FileText,
    Gauge,
    ListChecks,
    ShieldCheck,
    Users,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
    getPriorityTone,
    pilotFeedbackSummaryReport,
} from "./data/pilotFeedbackSummaryReport";
import {
    createReportDocxBlob,
    downloadBlob,
} from "./utils/docxExportUtils";

const SectionShell = memo(({ title, eyebrow, children, rightSlot }) => (
    <section className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/70 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                        {eyebrow}
                    </p>
                )}
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                    {title}
                </h2>
            </div>
            {rightSlot}
        </div>
        {children}
    </section>
));

SectionShell.displayName = "SectionShell";

const StatusPill = memo(({ children, tone = "default" }) => {
    const toneClass = {
        success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200",
        warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200",
        danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200",
        default: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white",
    }[tone] || "";

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black ${toneClass}`}>
            {children}
        </span>
    );
});

StatusPill.displayName = "StatusPill";

const ReportTable = memo(({ columns, rows, getRowKey }) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.key}
                            className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/50 ${column.className || ""}`}
                        >
                            {column.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/10 dark:bg-slate-950/60">
                {rows.map((row, index) => (
                    <tr key={getRowKey?.(row, index) || index} className="align-top">
                        {columns.map((column) => (
                            <td
                                key={column.key}
                                className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${column.cellClassName || ""}`}
                            >
                                {column.render ? column.render(row, index) : row[column.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
));

ReportTable.displayName = "ReportTable";

const statIcons = [Users, ListChecks, AlertTriangle, FileText, Gauge, ShieldCheck];

const issueColumns = [
    {
        key: "issue",
        label: "Issue",
        cellClassName: "min-w-[220px] font-bold text-slate-950 dark:text-white",
    },
    {
        key: "impact",
        label: "Impact",
        cellClassName: "min-w-[280px]",
    },
    {
        key: "priority",
        label: "Priority",
        render: (row) => <StatusPill tone={row.priority === "High" ? "danger" : row.priority === "Medium" ? "warning" : "success"}>{row.priority}</StatusPill>,
    },
    {
        key: "action",
        label: "Action",
        cellClassName: "min-w-[380px]",
    },
    {
        key: "effort",
        label: "Effort",
        render: (row) => <span className="font-bold">{row.effort}</span>,
    },
];

const AdminPilotSummaryReportPanel = memo(() => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const report = pilotFeedbackSummaryReport;
    const highPriorityIssues = useMemo(
        () => report.issues.filter((issue) => issue.priority === "High"),
        [report.issues],
    );

    const handleDownloadDocx = useCallback(() => {
        try {
            const blob = createReportDocxBlob(report);
            downloadBlob(blob, "MTSS_Feedback_Summary_Action_Plan.docx");
            toast({
                title: "DOCX generated",
                description: "The MTSS feedback summary report is ready.",
            });
        } catch (error) {
            toast({
                title: "DOCX generation failed",
                description: error?.message || "Please try again.",
                variant: "destructive",
            });
        }
    }, [report, toast]);

    return (
        <div className="space-y-6">
            <section className="rounded-[32px] border border-white/60 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-sky-700 dark:border-sky-300/20 dark:bg-white/10 dark:text-sky-200">
                            <FileText className="h-4 w-4" />
                            Pak Faisal report
                        </div>
                        <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">
                            {report.title}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {report.executiveSummary}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                                Report date: {report.reportDate}
                            </span>
                            <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                                Source: {report.sourcePage}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <button
                            type="button"
                            onClick={handleDownloadDocx}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                        >
                            <Download className="h-4 w-4" />
                            Generate DOCX
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/mtss/admin?tab=pilot-feedback")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            Open Feedback Data
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {report.stats.map((stat, index) => {
                    const Icon = statIcons[index] || Gauge;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-950/70"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
                                        {stat.label}
                                    </p>
                                    <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {stat.detail}
                            </p>
                        </div>
                    );
                })}
            </div>

            <SectionShell title="Document Quality Check" eyebrow="Criteria">
                <ReportTable
                    columns={[
                        { key: "criterion", label: "Criterion", cellClassName: "min-w-[240px] font-bold text-slate-950 dark:text-white" },
                        { key: "status", label: "Status", render: () => <StatusPill tone="success">Pass</StatusPill> },
                        { key: "evidence", label: "How this document meets it", cellClassName: "min-w-[360px]" },
                    ]}
                    rows={report.qualityChecks}
                    getRowKey={(row) => row.criterion}
                />
            </SectionShell>

            <SectionShell title="Main Findings" eyebrow="Stakeholder summary">
                <ReportTable
                    columns={[
                        { key: "finding", label: "Finding", cellClassName: "min-w-[300px] font-bold text-slate-950 dark:text-white" },
                        { key: "meaning", label: "What it means", cellClassName: "min-w-[360px]" },
                        { key: "decision", label: "Required decision", cellClassName: "min-w-[260px] font-semibold" },
                    ]}
                    rows={report.mainFindings}
                    getRowKey={(row) => row.finding}
                />
            </SectionShell>

            <SectionShell
                title="High Priority Issues"
                eyebrow="Fix before rollout"
                rightSlot={<StatusPill tone="danger">{highPriorityIssues.length} high priority</StatusPill>}
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    {highPriorityIssues.map((issue) => (
                        <article
                            key={issue.issue}
                            className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 dark:border-rose-300/15 dark:bg-rose-500/10"
                        >
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${getPriorityTone(issue.priority)}`}>
                                    {issue.priority}
                                </span>
                                <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                                    Effort: {issue.effort}
                                </span>
                            </div>
                            <h3 className="text-base font-black text-slate-950 dark:text-white">
                                {issue.issue}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                <span className="font-bold">Impact: </span>
                                {issue.impact}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                <span className="font-bold">Action: </span>
                                {issue.action}
                            </p>
                        </article>
                    ))}
                </div>
            </SectionShell>

            <SectionShell title="Full Action Plan" eyebrow="Developer-ready table">
                <ReportTable columns={issueColumns} rows={report.issues} getRowKey={(row) => row.issue} />
            </SectionShell>

            <div className="grid gap-6 xl:grid-cols-2">
                <SectionShell title="Recommended Delivery Order" eyebrow="Execution sequence">
                    <ReportTable
                        columns={[
                            { key: "order", label: "Order", cellClassName: "font-black text-slate-950 dark:text-white" },
                            { key: "workItem", label: "Work item", cellClassName: "min-w-[220px] font-bold" },
                            { key: "exitCriteria", label: "Exit criteria", cellClassName: "min-w-[320px]" },
                        ]}
                        rows={report.deliveryOrder}
                        getRowKey={(row) => row.order}
                    />
                </SectionShell>

                <SectionShell title="Rollout Gates" eyebrow="Do not rollout until pass">
                    <ReportTable
                        columns={[
                            { key: "gate", label: "Gate", cellClassName: "min-w-[160px] font-bold text-slate-950 dark:text-white" },
                            { key: "passCondition", label: "Pass condition", cellClassName: "min-w-[360px]" },
                        ]}
                        rows={report.rolloutGates}
                        getRowKey={(row) => row.gate}
                    />
                </SectionShell>
            </div>

            <SectionShell title="Principal Data Notes" eyebrow="Pilot sessions included">
                <ReportTable
                    columns={[
                        { key: "principal", label: "Principal", cellClassName: "min-w-[220px] font-bold text-slate-950 dark:text-white" },
                        { key: "unit", label: "Unit" },
                        { key: "stepCompletion", label: "Step completion" },
                        { key: "bugReports", label: "Bug reports" },
                        { key: "finalFeedbackState", label: "Final feedback" },
                        { key: "finalReadiness", label: "Readiness", cellClassName: "min-w-[220px]" },
                    ]}
                    rows={report.dataNotes}
                    getRowKey={(row) => row.principal}
                />
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {report.dataHandling.map((item) => (
                        <div
                            key={item}
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </SectionShell>
        </div>
    );
});

AdminPilotSummaryReportPanel.displayName = "AdminPilotSummaryReportPanel";

export default AdminPilotSummaryReportPanel;
