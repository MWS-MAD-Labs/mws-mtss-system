export const pilotFeedbackSummaryReport = {
    title: "MTSS Pilot Feedback Summary & Action Plan",
    sourcePage: "/mtss/admin?tab=pilot-feedback",
    reportDate: "2026-04-29",
    executiveSummary:
        "The pilot feedback shows that principals understand the value of MTSS for structured decision making, but the system is not ready for wider rollout until the high-priority workflow blockers are fixed.",
    stats: [
        { label: "Principal sessions", value: "3", detail: "Kindergarten, Elementary, Junior High" },
        { label: "Guided steps completed", value: "39/39", detail: "Each principal completed 13 of 13 pilot steps" },
        { label: "Bug reports", value: "7", detail: "Reported across included pilot sessions" },
        { label: "Final feedback saved", value: "2/3", detail: "One completed pilot is missing final feedback" },
        { label: "Average confidence", value: "4/5", detail: "Based on saved final feedback" },
        { label: "Readiness signal", value: "Mixed", detail: "1 Almost ready, 1 Not ready, 1 missing final readiness" },
    ],
    dataHandling: [
        "Used the latest meaningful session per principal.",
        "Excluded Pak Faisal admin sessions from the principal pilot summary.",
        "Ignored older empty draft sessions so they do not dilute the issue list.",
    ],
    qualityChecks: [
        {
            criterion: "Clear enough for non-technical stakeholders",
            status: "Pass",
            evidence: "The executive summary, main findings, impact column, and rollout gates explain user and school-operational consequences without requiring code knowledge.",
        },
        {
            criterion: "Actionable for developers",
            status: "Pass",
            evidence: "Each action names the expected UI behavior, API path, data field, component, validation rule, or test condition developers need to implement.",
        },
        {
            criterion: "Every issue has Impact, Priority, Action",
            status: "Pass",
            evidence: "The action plan contains 20 issue rows, and every row has a filled Impact, Priority, and Action column.",
        },
        {
            criterion: "No vague statement",
            status: "Pass",
            evidence: "Each issue uses pilot evidence, a concrete impact, and a testable action with acceptance detail.",
        },
    ],
    mainFindings: [
        {
            finding: "Evidence upload and AI Assistant have direct bug reports from multiple principals.",
            meaning: "These are core pilot features. If they fail, teachers cannot document progress evidence and cannot test AI-supported MTSS guidance.",
            decision: "Fix before any wider rollout.",
        },
        {
            finding: "Multi-subject MTSS visibility is incomplete.",
            meaning: "Principals cannot yet see whether Math, English, Behavior, and Attendance support for the same student are separate plans with separate owners.",
            decision: "Treat student + subject as the required unit for filters, mentor ownership, and charts.",
        },
        {
            finding: "Evidence rules, progress status examples, empty filter states, and pilot terms need visible UI copy.",
            meaning: "Principals can complete the pilot, but teachers will need extra explanation when these labels stay hidden or ambiguous.",
            decision: "Add the exact helper text and empty states listed in the action plan before teacher onboarding.",
        },
        {
            finding: "One completed pilot session has no final feedback saved.",
            meaning: "Dashboard readiness metrics can show completed steps while final rollout recommendation is missing.",
            decision: "Add a final-feedback completion guard or visible admin warning.",
        },
    ],
    priorityDefinitions: [
        {
            priority: "High",
            definition: "Blocks a core MTSS workflow, creates incorrect operational decisions, or prevents pilot feature validation.",
        },
        {
            priority: "Medium",
            definition: "Does not fully block usage, but creates confusion, incomplete data, or support tickets that the UI can prevent.",
        },
        {
            priority: "Low",
            definition: "Polish or clarity issue that improves usability but does not block the pilot workflow.",
        },
    ],
    issues: [
        {
            issue: "Evidence upload fails in progress and evidence flows.",
            evidence:
                'Aria reported "cannot attach the evidence"; Kholida reported "cant upload picture" and "couldnt upload the picture"; Latifah asked what file types, size limits, success state, and failure state users should see.',
            impact:
                "Teachers cannot attach work samples or supporting documents. Growth Journey becomes less useful because progress entries lack proof.",
            priority: "High",
            action:
                "Fix the evidence upload path end to end: pass files={evidenceFiles} and setFiles={setEvidenceFiles} from QuickUpdateModal to EvidenceUploader; run upload tests through /mtss/upload-evidence for JPG, PNG, WEBP, PDF, DOC, and DOCX files under 5 MB; save returned evidence into checkIns[].evidence; show uploaded file name, preview/download link, and exact error message for unsupported type or size.",
            effort: "Medium",
        },
        {
            issue: "AI Assistant cannot be opened or cannot answer MTSS prompts.",
            evidence:
                'Aria reported "I cannot open AI Assistant"; Kholida reported AI had technical issues and could not provide an answer; Aria\'s final feedback named AI Assistant as the slowest part and top improvement.',
            impact:
                "Principals cannot validate the AI Assistant step. Teachers lose guided support for intervention planning, progress notes, and overdue student prioritization.",
            priority: "High",
            action:
                'Add a principal smoke test that logs in as head_unit, opens /ai-assistant, opens the Utility Dock launcher, sends "create intervention for selected student" and "rank overdue mtss students", and expects a non-empty MTSS response. If the model/API fails, show a retry button and the message "AI Assistant could not respond. Retry or continue without AI."',
            effort: "Medium",
        },
        {
            issue: "Subject/type filter gives no visible subject-level result change.",
            evidence:
                "Aria reported no visible response when filtering by subject. Multiple principals asked how one student in Math and English MTSS would appear.",
            impact:
                "Principals cannot quickly find subject-specific Tier 2/3 students. Multi-subject support can be misread as one generic plan.",
            priority: "High",
            action:
                "Replace the All Types filter label with All Subjects / Intervention Types; update the filter predicate to match student.type, intervention type, intervention label, assignment option subject fields, and latest update subject; show the filtered result count after every filter change; add a test student assigned to both Math and English and confirm the student appears under both filters.",
            effort: "Medium",
        },
        {
            issue: "Multi-subject MTSS visibility is not explicit enough across dashboard, graph, and mentor ownership.",
            evidence:
                "Aria asked how a student in two MTSS subjects appears in graphs and how teachers distinguish subjects.",
            impact:
                "Leadership may make the wrong decision if Math progress, English progress, and mentor ownership are combined under one student-level signal.",
            priority: "High",
            action:
                "Show subject chips and owner per active intervention on student cards, student detail, mentor coverage, and analytics. For charts, use student + subject as the grouping unit when showing support coverage or progress, while still allowing a student-level summary.",
            effort: "High",
        },
        {
            issue: "Edit Plan icon does not open consistently and the edit page lacks selected-plan context.",
            evidence:
                'Kholida reported "couldnt open the icon"; Aria said edit was confusing; Latifah said it is not clear what the Edit Plan page looks like.',
            impact:
                "Teachers may fail to revise active interventions and may create duplicate plans instead of updating the current plan.",
            priority: "High",
            action:
                'Make the Edit Plan icon and text label a single clickable button in dashboard and My Students rows. On click, open EditInterventionPanel with the selected assignment, subject, current goal, baseline, target, and owner visible at the top. Add this permission message for blocked users: "You can only edit plans assigned to your subject or role."',
            effort: "Medium",
        },
        {
            issue: "Pilot feedback form flickers after typing.",
            evidence: "Kholida reported the screen blinks every time she finishes typing.",
            impact:
                "Feedback entry feels unstable and may cause principals to stop writing detailed comments.",
            priority: "High",
            action:
                "Remove re-mounting or animation triggers from controlled feedback inputs. Debounce non-save state changes, and only sync pilot feedback after explicit Save actions. Add a regression test that typing 20 characters into feedback does not reset focus or visually re-render the modal.",
            effort: "Medium",
        },
        {
            issue: "Final feedback can be missing even after all guided steps are completed.",
            evidence: "Kholida completed 13/13 steps, but final feedback was not saved.",
            impact:
                "Pak Faisal's dashboard can show a completed pilot without a final rollout recommendation, missing feature notes, and readiness decision.",
            priority: "Medium",
            action:
                'When completedStepCount === stepCount and finalFeedbackSavedAt is empty, show a blocking "Submit final feedback" callout in the pilot hub and a "Final feedback missing" badge in Pak Faisal\'s dashboard. Do not count readiness as complete until final feedback is saved.',
            effort: "Low",
        },
        {
            issue: "Evidence upload rules and result states are not visible before upload.",
            evidence:
                "Latifah asked which files are allowed, size limit, preview/file name/success state, and what happens if upload fails.",
            impact:
                "Users cannot self-correct upload problems and may report preventable support tickets.",
            priority: "Medium",
            action:
                'Add helper text directly inside EvidenceUploader: "Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX. Max 5 MB each. Max 5 files." After upload, show success toast and saved evidence count. On failure, show the exact backend error per file.',
            effort: "Low",
        },
        {
            issue: "Progress date rules are missing from the progress form.",
            evidence:
                "Aria asked whether teachers can change dates, whether assigned dates are fixed, and what happens when teachers miss the assigned date.",
            impact:
                "Teachers may enter progress on the wrong day or avoid submitting late progress.",
            priority: "Medium",
            action:
                'Make the date field editable for unsaved progress updates. If the selected date is before the current local date, require a Late update reason field and show the copy "This update is late; add a reason before saving." Store the reason with the check-in record.',
            effort: "Medium",
        },
        {
            issue: '"Performed / skipped" status has no in-app definition.',
            evidence: "Latifah asked for a simple example of performed/skipped status.",
            impact:
                "Teachers may log skipped interventions as completed progress, which makes progress history unreliable.",
            priority: "Medium",
            action:
                'Add two examples beside the status control: "Performed: student completed the planned intervention today" and "Skipped: intervention did not happen; choose a reason." Require skip reason when status is skipped.',
            effort: "Low",
        },
        {
            issue: 'Intervention form mixes "Subject" and "Type" labels.',
            evidence: 'Latifah said "Subject or type" could be confusing.',
            impact:
                "Teachers may select the wrong classification, making filters and reports less reliable.",
            priority: "Medium",
            action:
                'Rename user-facing form and filter labels from Type to Subject / Focus Area. Use examples in the select placeholder: "Math, English, Behavior, Attendance". Keep database field names unchanged for this action plan.',
            effort: "Medium",
        },
        {
            issue: "Intervention duration options include unrealistic long choices.",
            evidence: "Kholida said very long duration options are not needed.",
            impact:
                "Teachers may create plans that are too long to monitor effectively within the MTSS cycle.",
            priority: "Medium",
            action:
                "Limit default duration options to the agreed MTSS review cycles, such as 2 weeks, 4 weeks, 6 weeks, and 8 weeks. Put longer durations behind a custom option that requires a reason.",
            effort: "Low",
        },
        {
            issue: "Empty filter results do not explain what happened.",
            evidence:
                'Latifah asked what should happen if no results are found and suggested a "no data" state.',
            impact:
                "Principals may think the page is broken when filters return no students.",
            priority: "Medium",
            action:
                'Add an empty state to student lists: "No students match the selected filters." Include a Clear filters button and keep the current filter chips visible.',
            effort: "Low",
        },
        {
            issue: "Mentor assignment can be saved without focus areas.",
            evidence: "Kholida said focus areas should be required.",
            impact:
                "Assignments can be too broad for teachers to know what to support or measure.",
            priority: "Medium",
            action:
                "Make focus area required in the mentor assignment form and backend validation. Disable Save until at least one focus area is entered. Show the focus areas on the mentor card and student detail page.",
            effort: "Low",
        },
        {
            issue: "Mentor visibility appears to show only Tier 2.",
            evidence: "Kholida said she did not understand why only Tier 2 appears.",
            impact:
                "Tier 3 coverage may look missing or underreported, causing leadership confusion.",
            priority: "Medium",
            action:
                "Set mentor visibility default filter to All tiers. Add a visible tier selector with All tiers, Tier 2, and Tier 3. Show the active filter beside the chart title and include both Tier 2 and Tier 3 counts in the summary.",
            effort: "Medium",
        },
        {
            issue: "Student detail lacks attendance context for MTSS decisions.",
            evidence:
                "Kholida requested MTSS attendance data because attendance can explain why support is not working.",
            impact:
                "Principals may misread low progress as intervention failure when attendance is the actual blocker.",
            priority: "Medium",
            action:
                "Add an attendance signal to student detail: attendance rate, missed MTSS sessions, and last absence date. Show it beside Growth Journey and include it in decision simulation evidence.",
            effort: "High",
        },
        {
            issue: "Analytics lack sample chart guidance and year-over-year trend state.",
            evidence:
                "Latifah requested visual examples; Kholida requested progress trend from year to year.",
            impact:
                "Leadership may not trust analytics enough for follow-up decisions.",
            priority: "Medium",
            action:
                'Add one sample tooltip or empty-state example per analytics chart. Add year-over-year trend only when historical data exists; otherwise show "Year-over-year trend needs at least two school years of data."',
            effort: "Medium",
        },
        {
            issue: "AI Assistant needs an incorrect-answer feedback path.",
            evidence:
                "Latifah asked what teachers should do if AI gives a wrong or generic answer.",
            impact:
                "Teachers may accept weak AI guidance or stop trusting the tool.",
            priority: "Medium",
            action:
                "Add Mark as not useful and Report wrong answer actions to AI responses. Store the prompt, response, user role, and selected reason for review. Add copy that AI suggestions must be checked against student evidence before action.",
            effort: "Medium",
        },
        {
            issue: "Pilot instructions contain undefined UI terms.",
            evidence:
                'Latifah asked about "gray route chips", "preserve context", and how detailed decision justification should be.',
            impact:
                "Principals can complete the step, but they need extra explanation for UI-specific terms.",
            priority: "Low",
            action:
                'Replace technical terms in pilot copy: "gray route chips" -> "gray page label badges"; "preserve context" -> "return to the same filtered list"; add a decision justification example with 2-3 sentences.',
            effort: "Low",
        },
        {
            issue: "Student list typography is too small for fast principal scanning.",
            evidence:
                "Kholida said the default font size and type can be clearer.",
            impact:
                "Student data is harder to scan during principal review, especially in dense tables.",
            priority: "Low",
            action:
                "Increase minimum table body text to 13-14 px, keep headings at 10-11 px only for labels, run a light/dark contrast check, and test the longest student name and intervention label on desktop and mobile.",
            effort: "Low",
        },
    ],
    deliveryOrder: [
        {
            order: "1",
            workItem: "Evidence upload fix",
            exitCriteria:
                "A teacher can attach JPG, PNG, PDF, DOC, and DOCX evidence from Quick Update; the file appears in Growth Journey after refresh.",
        },
        {
            order: "2",
            workItem: "AI Assistant access and response fix",
            exitCriteria:
                "A principal can open /ai-assistant and receive a response to two MTSS prompts without route or permission errors.",
        },
        {
            order: "3",
            workItem: "Subject filter and multi-subject visibility",
            exitCriteria:
                "A student with Math and English MTSS appears correctly under each subject filter, with separate subject chips and owners visible.",
        },
        {
            order: "4",
            workItem: "Edit Plan reliability",
            exitCriteria:
                "Authorized teachers can open Edit Plan from dashboard and My Students; unauthorized users see a specific permission message.",
        },
        {
            order: "5",
            workItem: "Final feedback completion guard",
            exitCriteria:
                "A completed 13/13 pilot cannot be treated as rollout-ready until final feedback is saved.",
        },
        {
            order: "6",
            workItem: "Clarity and onboarding copy",
            exitCriteria:
                "Evidence rules, performed/skipped examples, empty state, and ambiguous pilot terms are visible in-app.",
        },
    ],
    rolloutGates: [
        {
            gate: "Evidence gate",
            passCondition:
                "Upload from Quick Update succeeds for at least 1 image and 1 PDF, and both are visible in student Growth Journey after page refresh.",
        },
        {
            gate: "AI gate",
            passCondition:
                "AI Assistant opens for a principal account and answers 2 MTSS prompts within the expected timeout.",
        },
        {
            gate: "Subject gate",
            passCondition:
                "Admin student filter returns correct results for a multi-subject student and shows subject-level ownership.",
        },
        {
            gate: "Edit gate",
            passCondition:
                "Edit Plan opens the correct active intervention without duplicating or erasing progress history.",
        },
        {
            gate: "Feedback gate",
            passCondition:
                "Pak Faisal dashboard clearly distinguishes Completed with final feedback from Completed steps but final feedback missing.",
        },
    ],
    dataNotes: [
        {
            principal: "Latifah Nur Restiningtyas",
            unit: "Kindergarten",
            stepCompletion: "13/13",
            bugReports: "0",
            finalFeedbackState: "Saved",
            finalReadiness: "Almost ready",
        },
        {
            principal: "Aria Wisnuwardana",
            unit: "Junior High",
            stepCompletion: "13/13",
            bugReports: "2",
            finalFeedbackState: "Saved",
            finalReadiness: "Not ready",
        },
        {
            principal: "Kholida Widyawati",
            unit: "Elementary",
            stepCompletion: "13/13",
            bugReports: "5",
            finalFeedbackState: "Missing",
            finalReadiness: "Not counted as final readiness",
        },
    ],
};

export const getPriorityTone = (priority = "") => {
    switch (priority) {
        case "High":
            return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200";
        case "Medium":
            return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200";
        default:
            return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200";
    }
};
