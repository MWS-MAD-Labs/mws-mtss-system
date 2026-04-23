const normalizeText = (value = '') => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const toTrimmedText = (value = '') => String(value || '').trim();

export const normalizeRoleName = (role = '') => String(role || '').trim().toLowerCase();

const EXECUTE_AUTOMATION_ROLES = new Set([
    'teacher',
    'se_teacher',
    'head_unit',
    'principal',
    'directorate',
    'admin',
    'superadmin'
]);

const OPERATION_CONFIG = {
    create_mtss_intervention: {
        label: 'Create MTSS Intervention',
        description: 'Create a structured MTSS intervention plan for one student.',
        regex: /(create|buat|bikin|add|new)\s+.*(intervention|intervensi|mtss)/i
    },
    append_mtss_progress_checkin: {
        label: 'Log Progress Check-in',
        description: 'Log objective progress evidence for an MTSS assignment.',
        regex: /(log|append|update|isi|catat|submit).*(progress|check[\s-]?in|perkembangan|progres)/i
    },
    append_mtss_progress_checkin_with_evidence: {
        label: 'Log Progress + Evidence',
        description: 'Submit MTSS progress and evidence links together.',
        regex: /(log|submit|upload).*(progress).*(evidence|bukti|rubric|worksheet|assessment)/i
    },
    upload_mtss_evidence: {
        label: 'Upload MTSS Evidence',
        description: 'Upload MTSS evidence files/links and return structured metadata.',
        regex: /(upload|unggah).*(evidence|bukti|rubric|worksheet|assessment)/i
    },
    update_mtss_intervention_plan: {
        label: 'Update Intervention Plan',
        description: 'Revise focus, strategy, monitoring, and targets on an active plan.',
        regex: /(update|revise|ubah|perbarui).*(intervention|plan|rencana).*(mtss|tier|monitoring|strategy)/i
    },
    bulk_append_mtss_progress_checkin: {
        label: 'Bulk Progress Check-in',
        description: 'Submit progress check-ins for multiple assignments at once.',
        regex: /(bulk|mass|batch).*(progress|check[\s-]?in|progres)/i
    },
    bulk_update_mtss_assignment_status: {
        label: 'Bulk Status Update',
        description: 'Update status across multiple MTSS assignments in one run.',
        regex: /(bulk|mass|batch).*(status).*(assignment|mtss)/i
    },
    clone_mtss_intervention_plan: {
        label: 'Clone Intervention Plan',
        description: 'Duplicate a proven intervention plan to new student targets.',
        regex: /(clone|duplicate|copy|salin).*(intervention|plan|rencana)/i
    },
    complete_mtss_assignment_with_outcome_summary: {
        label: 'Complete With Outcome',
        description: 'Close assignment with outcome summary and next support recommendation.',
        regex: /(complete|close|finish|selesaikan).*(assignment|intervention).*(outcome|summary|ringkasan)/i
    },
    request_mtss_tier_review: {
        label: 'Request Tier Review',
        description: 'Submit tier escalation/de-escalation request to leadership queue.',
        regex: /(request|ajukan|submit).*(tier).*(review|escalat|deescalat|peninjauan)/i
    },
    assign_students_to_mtss_mentor: {
        label: 'Assign Students to Mentor',
        description: 'Assign one or more students to a mentor scope.',
        regex: /(assign|tetapkan|hubungkan|link).*(student|siswa).*(mentor|mtss)/i
    },
    assign_intervention_mentor: {
        label: 'Assign Mentor by Subject',
        description: 'Assign mentor to an intervention focus/subject.',
        regex: /(assign|tetapkan|map).*(mentor).*(subject|focus|intervention|intervensi)/i
    },
    reassign_mtss_assignment_mentor: {
        label: 'Reassign Mentor',
        description: 'Reassign mentor ownership for an assignment.',
        regex: /(reassign|ganti).*(mentor)/i
    },
    update_mtss_assignment_status: {
        label: 'Update Assignment Status',
        description: 'Update assignment lifecycle status and optional notes.',
        regex: /(update|ubah|ganti).*(status).*(assignment|mtss|intervention|intervensi)/i
    },
    update_mtss_goal_completion: {
        label: 'Update Goal Completion',
        description: 'Mark goal completion state with summary.',
        regex: /(update|mark|tandai|ubah).*(goal).*(complete|selesai|completion)/i
    }
};

const OPERATION_ORDER = [
    'create_mtss_intervention',
    'append_mtss_progress_checkin_with_evidence',
    'append_mtss_progress_checkin',
    'upload_mtss_evidence',
    'update_mtss_intervention_plan',
    'bulk_append_mtss_progress_checkin',
    'bulk_update_mtss_assignment_status',
    'clone_mtss_intervention_plan',
    'complete_mtss_assignment_with_outcome_summary',
    'request_mtss_tier_review',
    'assign_students_to_mtss_mentor',
    'assign_intervention_mentor',
    'reassign_mtss_assignment_mentor',
    'update_mtss_assignment_status',
    'update_mtss_goal_completion'
];

const OPERATION_FORM_FIELDS = {
    create_mtss_intervention: [
        { key: 'studentId', label: 'Student ID', type: 'text', required: true, placeholder: 'student id' },
        { key: 'strategy', label: 'Strategy', type: 'text', required: true, placeholder: 'Emotion Menu / strategy name' },
        { key: 'goal', label: 'Goal', type: 'textarea', required: true, placeholder: 'measurable goal' },
        { key: 'tier', label: 'Tier', type: 'select', required: true, options: ['Tier 1', 'Tier 2', 'Tier 3'] },
        { key: 'focusArea', label: 'Focus Area', type: 'text', required: false, placeholder: 'SEL / Behavior / Math / English' },
        { key: 'durationWeeks', label: 'Duration (weeks)', type: 'number', required: false, placeholder: '6' },
        { key: 'mentorId', label: 'Mentor ID', type: 'text', required: false, placeholder: 'mentor id (optional)' }
    ],
    append_mtss_progress_checkin: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'summary', label: 'Progress Summary', type: 'textarea', required: true, placeholder: 'objective progress update' },
        { key: 'score', label: 'Score / Value', type: 'number', required: false, placeholder: '78' },
        { key: 'interventionPerformed', label: 'Intervention Performed', type: 'select', required: true, options: ['yes', 'no'] },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'optional notes' }
    ],
    append_mtss_progress_checkin_with_evidence: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'summary', label: 'Progress Summary', type: 'textarea', required: true, placeholder: 'objective progress update' },
        { key: 'score', label: 'Score / Value', type: 'number', required: false, placeholder: '78' },
        { key: 'evidenceUrlsCsv', label: 'Evidence URLs', type: 'textarea', required: true, placeholder: 'https://..., https://...' },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'optional notes' }
    ],
    upload_mtss_evidence: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: false, placeholder: 'assignment id (optional)' },
        { key: 'evidenceUrlsCsv', label: 'Evidence URLs', type: 'textarea', required: true, placeholder: 'https://..., https://...' }
    ],
    update_mtss_intervention_plan: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'focusAreasCsv', label: 'Focus Areas', type: 'textarea', required: false, placeholder: 'SEL, Behavior, Math' },
        { key: 'strategyName', label: 'Strategy Name', type: 'text', required: false, placeholder: 'strategy name' },
        { key: 'monitoringMethod', label: 'Monitoring Method', type: 'select', required: false, options: ['Option 1 - Direct Observation', 'Option 2 - Student Self-Report', 'Option 3 - Assessment Data'] },
        { key: 'monitoringFrequency', label: 'Monitoring Frequency', type: 'select', required: false, options: ['Daily', 'Weekly', 'Bi-weekly', 'Custom'] },
        { key: 'tier', label: 'Tier', type: 'select', required: false, options: ['tier1', 'tier2', 'tier3'] },
        { key: 'duration', label: 'Duration', type: 'select', required: false, options: ['4 weeks', '6 weeks', '8 weeks', '10 weeks', '12 weeks', '16 weeks', '20 weeks', '24 weeks'] },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'revision notes' }
    ],
    bulk_append_mtss_progress_checkin: [
        { key: 'assignmentIdsCsv', label: 'Assignment IDs', type: 'textarea', required: true, placeholder: 'id1, id2, id3' },
        { key: 'summary', label: 'Shared Summary', type: 'textarea', required: true, placeholder: 'shared progress summary' },
        { key: 'score', label: 'Score / Value', type: 'number', required: false, placeholder: '78' },
        { key: 'status', label: 'Status', type: 'select', required: false, options: ['active', 'paused', 'completed', 'closed'] },
        { key: 'evidenceUrlsCsv', label: 'Evidence URLs', type: 'textarea', required: false, placeholder: 'https://..., https://...' }
    ],
    bulk_update_mtss_assignment_status: [
        { key: 'assignmentIdsCsv', label: 'Assignment IDs', type: 'textarea', required: true, placeholder: 'id1, id2, id3' },
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['active', 'paused', 'completed', 'closed'] },
        { key: 'summary', label: 'Summary', type: 'textarea', required: false, placeholder: 'short summary for all' },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'optional notes' }
    ],
    clone_mtss_intervention_plan: [
        { key: 'sourceAssignmentId', label: 'Source Assignment ID', type: 'text', required: true, placeholder: 'source assignment id' },
        { key: 'studentIdsCsv', label: 'Target Student IDs', type: 'textarea', required: true, placeholder: 'id1, id2, id3' },
        { key: 'mentorId', label: 'Mentor ID', type: 'text', required: false, placeholder: 'mentor id (admin optional)' },
        { key: 'tier', label: 'Tier Override', type: 'select', required: false, options: ['tier1', 'tier2', 'tier3'] },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'optional clone note' }
    ],
    complete_mtss_assignment_with_outcome_summary: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'outcomeSummary', label: 'Outcome Summary', type: 'textarea', required: false, placeholder: 'completion summary (optional)' },
        { key: 'autoRequestTierReview', label: 'Auto Tier Review', type: 'select', required: true, options: ['yes', 'no'] },
        { key: 'requestTier', label: 'Request Tier', type: 'select', required: false, options: ['tier1', 'tier2', 'tier3'] },
        { key: 'requestRationale', label: 'Tier Review Rationale', type: 'textarea', required: false, placeholder: 'why request tier review' }
    ],
    request_mtss_tier_review: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'requestedTier', label: 'Requested Tier', type: 'select', required: true, options: ['tier1', 'tier2', 'tier3'] },
        { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['high', 'medium', 'low'] },
        { key: 'rationale', label: 'Rationale', type: 'textarea', required: true, placeholder: 'why this tier review is needed' },
        { key: 'evidenceUrlsCsv', label: 'Evidence URLs', type: 'textarea', required: false, placeholder: 'https://..., https://...' }
    ],
    assign_students_to_mtss_mentor: [
        { key: 'mentorId', label: 'Mentor ID', type: 'text', required: true, placeholder: 'mentor id' },
        { key: 'studentIdsCsv', label: 'Student IDs', type: 'textarea', required: true, placeholder: 'id1, id2, id3' }
    ],
    assign_intervention_mentor: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'mentorId', label: 'Mentor ID', type: 'text', required: true, placeholder: 'mentor id' },
        { key: 'subject', label: 'Subject / Focus', type: 'text', required: false, placeholder: 'SEL / Behavior / Math' }
    ],
    reassign_mtss_assignment_mentor: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'mentorId', label: 'New Mentor ID', type: 'text', required: true, placeholder: 'new mentor id' },
        { key: 'reason', label: 'Reason', type: 'textarea', required: false, placeholder: 'optional reason' }
    ],
    update_mtss_assignment_status: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['active', 'paused', 'completed', 'closed'] },
        { key: 'summary', label: 'Summary', type: 'textarea', required: false, placeholder: 'short summary' },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'optional notes' }
    ],
    update_mtss_goal_completion: [
        { key: 'assignmentId', label: 'Assignment ID', type: 'text', required: true, placeholder: 'assignment id' },
        { key: 'goalIndex', label: 'Goal Index', type: 'number', required: false, placeholder: '0 (optional)' },
        { key: 'goalText', label: 'Goal Text', type: 'textarea', required: false, placeholder: 'required if goal index is empty' },
        { key: 'completed', label: 'Completed', type: 'select', required: true, options: ['yes', 'no'] },
        { key: 'summary', label: 'Summary', type: 'textarea', required: false, placeholder: 'optional summary' }
    ]
};

const DEFAULT_VALUES = {
    tier: 'Tier 2',
    interventionPerformed: 'yes',
    status: 'active',
    completed: 'yes',
    autoRequestTierReview: 'yes',
    priority: 'medium'
};

const toCsvList = (rawValue = '') =>
    String(rawValue || '')
        .split(/[,;\n]/g)
        .map((item) => item.trim())
        .filter(Boolean);

const toEvidenceListFromCsv = (rawValue = '') =>
    toCsvList(rawValue).map((url) => ({ url }));

const toBoolean = (rawValue = '', fallback = false) => {
    const value = String(rawValue || '').trim().toLowerCase();
    if (!value) return fallback;
    if (['yes', 'y', 'true', '1'].includes(value)) return true;
    if (['no', 'n', 'false', '0'].includes(value)) return false;
    return fallback;
};

const toNumberIfPossible = (rawValue = '') => {
    const parsed = Number(String(rawValue || '').trim());
    return Number.isFinite(parsed) ? parsed : null;
};

const getSeedValue = (seedPayload = {}, keys = [], fallback = '') => {
    for (const key of keys) {
        const value = seedPayload?.[key];
        if (value === null || value === undefined) continue;
        if (typeof value === 'string' && !value.trim()) continue;
        if (Array.isArray(value) && value.length === 0) continue;
        return value;
    }
    return fallback;
};

const buildInitialFormValues = (operation = '', seedPayload = {}) => {
    const base = {};

    if (operation === 'create_mtss_intervention') {
        base.studentId = getSeedValue(seedPayload, ['studentId', 'targetStudentId'], '');
        base.strategy = getSeedValue(seedPayload, ['strategy', 'interventionStrategy'], '');
        base.goal = getSeedValue(seedPayload, ['goal'], '');
        base.tier = getSeedValue(seedPayload, ['tier'], DEFAULT_VALUES.tier);
        base.focusArea = getSeedValue(seedPayload, ['focusArea', 'subject'], '');
        base.durationWeeks = getSeedValue(seedPayload, ['durationWeeks', 'duration'], '');
        base.mentorId = getSeedValue(seedPayload, ['mentorId'], '');
    } else if (operation === 'append_mtss_progress_checkin') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.summary = getSeedValue(seedPayload, ['summary'], '');
        base.score = getSeedValue(seedPayload, ['score', 'value'], '');
        base.interventionPerformed = getSeedValue(seedPayload, ['interventionPerformed'], DEFAULT_VALUES.interventionPerformed);
        base.notes = getSeedValue(seedPayload, ['notes'], '');
    } else if (operation === 'append_mtss_progress_checkin_with_evidence') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.summary = getSeedValue(seedPayload, ['summary'], '');
        base.score = getSeedValue(seedPayload, ['score', 'value'], '');
        const evidence = getSeedValue(seedPayload, ['evidence'], []);
        base.evidenceUrlsCsv = Array.isArray(evidence)
            ? evidence.map((entry) => entry?.url).filter(Boolean).join(', ')
            : '';
        base.notes = getSeedValue(seedPayload, ['notes'], '');
    } else if (operation === 'upload_mtss_evidence') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        const evidence = getSeedValue(seedPayload, ['evidence'], []);
        base.evidenceUrlsCsv = Array.isArray(evidence)
            ? evidence.map((entry) => entry?.url).filter(Boolean).join(', ')
            : '';
    } else if (operation === 'update_mtss_intervention_plan') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        const focusAreas = getSeedValue(seedPayload, ['focusAreas'], []);
        base.focusAreasCsv = Array.isArray(focusAreas) ? focusAreas.join(', ') : String(focusAreas || '');
        base.strategyName = getSeedValue(seedPayload, ['strategyName'], '');
        base.monitoringMethod = getSeedValue(seedPayload, ['monitoringMethod'], '');
        base.monitoringFrequency = getSeedValue(seedPayload, ['monitoringFrequency'], '');
        base.tier = getSeedValue(seedPayload, ['tier'], '');
        base.duration = getSeedValue(seedPayload, ['duration'], '');
        base.notes = getSeedValue(seedPayload, ['notes'], '');
    } else if (operation === 'bulk_append_mtss_progress_checkin') {
        const assignmentIds = getSeedValue(seedPayload, ['assignmentIds'], []);
        base.assignmentIdsCsv = Array.isArray(assignmentIds) ? assignmentIds.join(', ') : String(assignmentIds || '');
        base.summary = getSeedValue(seedPayload, ['summary'], '');
        base.score = getSeedValue(seedPayload, ['score', 'value'], '');
        base.status = getSeedValue(seedPayload, ['status'], '');
        const evidence = getSeedValue(seedPayload, ['evidence'], []);
        base.evidenceUrlsCsv = Array.isArray(evidence)
            ? evidence.map((entry) => entry?.url).filter(Boolean).join(', ')
            : '';
    } else if (operation === 'bulk_update_mtss_assignment_status') {
        const assignmentIds = getSeedValue(seedPayload, ['assignmentIds'], []);
        base.assignmentIdsCsv = Array.isArray(assignmentIds) ? assignmentIds.join(', ') : String(assignmentIds || '');
        base.status = getSeedValue(seedPayload, ['status'], DEFAULT_VALUES.status);
        base.summary = getSeedValue(seedPayload, ['summary'], '');
        base.notes = getSeedValue(seedPayload, ['notes'], '');
    } else if (operation === 'clone_mtss_intervention_plan') {
        base.sourceAssignmentId = getSeedValue(seedPayload, ['sourceAssignmentId', 'assignmentId'], '');
        const studentIds = getSeedValue(seedPayload, ['studentIds'], []);
        base.studentIdsCsv = Array.isArray(studentIds) ? studentIds.join(', ') : String(studentIds || '');
        base.mentorId = getSeedValue(seedPayload, ['mentorId'], '');
        base.tier = getSeedValue(seedPayload, ['tier'], '');
        base.notes = getSeedValue(seedPayload, ['notes'], '');
    } else if (operation === 'complete_mtss_assignment_with_outcome_summary') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.outcomeSummary = getSeedValue(seedPayload, ['outcomeSummary', 'summary'], '');
        base.autoRequestTierReview = getSeedValue(seedPayload, ['autoRequestTierReview'], DEFAULT_VALUES.autoRequestTierReview);
        base.requestTier = getSeedValue(seedPayload, ['requestTier', 'requestedTier'], '');
        base.requestRationale = getSeedValue(seedPayload, ['requestRationale'], '');
    } else if (operation === 'request_mtss_tier_review') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.requestedTier = getSeedValue(seedPayload, ['requestedTier', 'requestTier'], 'tier2');
        base.priority = getSeedValue(seedPayload, ['priority'], DEFAULT_VALUES.priority);
        base.rationale = getSeedValue(seedPayload, ['rationale', 'summary'], '');
        const evidence = getSeedValue(seedPayload, ['evidence'], []);
        base.evidenceUrlsCsv = Array.isArray(evidence)
            ? evidence.map((entry) => entry?.url).filter(Boolean).join(', ')
            : '';
    } else if (operation === 'assign_students_to_mtss_mentor') {
        base.mentorId = getSeedValue(seedPayload, ['mentorId'], '');
        const studentIds = getSeedValue(seedPayload, ['studentIds'], []);
        base.studentIdsCsv = Array.isArray(studentIds) ? studentIds.join(', ') : String(studentIds || '');
    } else if (operation === 'assign_intervention_mentor') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.mentorId = getSeedValue(seedPayload, ['mentorId'], '');
        base.subject = getSeedValue(seedPayload, ['subject', 'focusArea'], '');
    } else if (operation === 'reassign_mtss_assignment_mentor') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.mentorId = getSeedValue(seedPayload, ['mentorId'], '');
        base.reason = getSeedValue(seedPayload, ['reason', 'notes'], '');
    } else if (operation === 'update_mtss_assignment_status') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.status = getSeedValue(seedPayload, ['status'], DEFAULT_VALUES.status);
        base.summary = getSeedValue(seedPayload, ['summary'], '');
        base.notes = getSeedValue(seedPayload, ['notes'], '');
    } else if (operation === 'update_mtss_goal_completion') {
        base.assignmentId = getSeedValue(seedPayload, ['assignmentId'], '');
        base.goalIndex = getSeedValue(seedPayload, ['goalIndex'], '');
        base.goalText = getSeedValue(seedPayload, ['goalText', 'goal'], '');
        base.completed = getSeedValue(seedPayload, ['completed'], DEFAULT_VALUES.completed);
        base.summary = getSeedValue(seedPayload, ['summary'], '');
    }

    return base;
};

const validateRequiredText = (value = '', label = 'Field') => {
    const text = toTrimmedText(value);
    if (!text) return { error: `${label} is required.` };
    return { value: text };
};

const validateOperationPayload = (operation = '', formValues = {}, seedPayload = {}) => {
    const payload = { ...(seedPayload || {}) };

    if (operation === 'create_mtss_intervention') {
        const studentId = validateRequiredText(formValues.studentId, 'Student ID');
        if (studentId.error) return { error: studentId.error };
        const strategy = validateRequiredText(formValues.strategy, 'Strategy');
        if (strategy.error) return { error: strategy.error };
        const goal = validateRequiredText(formValues.goal, 'Goal');
        if (goal.error) return { error: goal.error };

        payload.studentId = studentId.value;
        payload.strategy = strategy.value;
        payload.goal = goal.value;
        payload.tier = toTrimmedText(formValues.tier) || 'Tier 2';

        const focusArea = toTrimmedText(formValues.focusArea);
        if (focusArea) payload.focusArea = focusArea;
        const durationWeeks = toNumberIfPossible(formValues.durationWeeks);
        if (durationWeeks !== null) payload.durationWeeks = durationWeeks;
        const mentorId = toTrimmedText(formValues.mentorId);
        if (mentorId) payload.mentorId = mentorId;
        return { payload };
    }

    if (operation === 'append_mtss_progress_checkin') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        const summary = validateRequiredText(formValues.summary, 'Progress Summary');
        if (summary.error) return { error: summary.error };

        payload.assignmentId = assignmentId.value;
        payload.summary = summary.value;
        payload.interventionPerformed = toBoolean(formValues.interventionPerformed, true);

        const score = toNumberIfPossible(formValues.score);
        if (score !== null) payload.score = score;
        const notes = toTrimmedText(formValues.notes);
        if (notes) payload.notes = notes;
        return { payload };
    }

    if (operation === 'append_mtss_progress_checkin_with_evidence') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        const summary = validateRequiredText(formValues.summary, 'Progress Summary');
        if (summary.error) return { error: summary.error };
        const evidence = toEvidenceListFromCsv(formValues.evidenceUrlsCsv);
        if (evidence.length === 0) return { error: 'At least one Evidence URL is required.' };

        payload.assignmentId = assignmentId.value;
        payload.summary = summary.value;
        payload.evidence = evidence;

        const score = toNumberIfPossible(formValues.score);
        if (score !== null) payload.score = score;
        const notes = toTrimmedText(formValues.notes);
        if (notes) payload.notes = notes;
        return { payload };
    }

    if (operation === 'upload_mtss_evidence') {
        const evidence = toEvidenceListFromCsv(formValues.evidenceUrlsCsv);
        if (evidence.length === 0) return { error: 'At least one Evidence URL is required.' };

        const assignmentId = toTrimmedText(formValues.assignmentId);
        if (assignmentId) payload.assignmentId = assignmentId;
        payload.evidence = evidence;
        return { payload };
    }

    if (operation === 'update_mtss_intervention_plan') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        payload.assignmentId = assignmentId.value;

        const focusAreas = toCsvList(formValues.focusAreasCsv);
        if (focusAreas.length > 0) payload.focusAreas = focusAreas;
        const strategyName = toTrimmedText(formValues.strategyName);
        if (strategyName) payload.strategyName = strategyName;
        const monitoringMethod = toTrimmedText(formValues.monitoringMethod);
        if (monitoringMethod) payload.monitoringMethod = monitoringMethod;
        const monitoringFrequency = toTrimmedText(formValues.monitoringFrequency);
        if (monitoringFrequency) payload.monitoringFrequency = monitoringFrequency;
        const tier = toTrimmedText(formValues.tier).toLowerCase();
        if (tier) payload.tier = tier;
        const duration = toTrimmedText(formValues.duration);
        if (duration) payload.duration = duration;
        const notes = toTrimmedText(formValues.notes);
        if (notes) payload.notes = notes;
        return { payload };
    }

    if (operation === 'bulk_append_mtss_progress_checkin') {
        const assignmentIds = toCsvList(formValues.assignmentIdsCsv);
        if (assignmentIds.length === 0) return { error: 'At least one Assignment ID is required.' };
        const summary = validateRequiredText(formValues.summary, 'Shared Summary');
        if (summary.error) return { error: summary.error };

        payload.assignmentIds = assignmentIds;
        payload.summary = summary.value;
        const score = toNumberIfPossible(formValues.score);
        if (score !== null) payload.score = score;
        const status = toTrimmedText(formValues.status).toLowerCase();
        if (status) payload.status = status;
        const evidence = toEvidenceListFromCsv(formValues.evidenceUrlsCsv);
        if (evidence.length > 0) payload.evidence = evidence;
        return { payload };
    }

    if (operation === 'bulk_update_mtss_assignment_status') {
        const assignmentIds = toCsvList(formValues.assignmentIdsCsv);
        if (assignmentIds.length === 0) return { error: 'At least one Assignment ID is required.' };
        const status = validateRequiredText(formValues.status, 'Status');
        if (status.error) return { error: status.error };

        payload.assignmentIds = assignmentIds;
        payload.status = status.value.toLowerCase();
        const summary = toTrimmedText(formValues.summary);
        if (summary) payload.summary = summary;
        const notes = toTrimmedText(formValues.notes);
        if (notes) payload.notes = notes;
        return { payload };
    }

    if (operation === 'clone_mtss_intervention_plan') {
        const sourceAssignmentId = validateRequiredText(formValues.sourceAssignmentId, 'Source Assignment ID');
        if (sourceAssignmentId.error) return { error: sourceAssignmentId.error };
        const studentIds = toCsvList(formValues.studentIdsCsv);
        if (studentIds.length === 0) return { error: 'At least one Target Student ID is required.' };

        payload.sourceAssignmentId = sourceAssignmentId.value;
        payload.studentIds = studentIds;
        const mentorId = toTrimmedText(formValues.mentorId);
        if (mentorId) payload.mentorId = mentorId;
        const tier = toTrimmedText(formValues.tier).toLowerCase();
        if (tier) payload.tier = tier;
        const notes = toTrimmedText(formValues.notes);
        if (notes) payload.notes = notes;
        return { payload };
    }

    if (operation === 'complete_mtss_assignment_with_outcome_summary') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };

        payload.assignmentId = assignmentId.value;
        const outcomeSummary = toTrimmedText(formValues.outcomeSummary);
        if (outcomeSummary) payload.outcomeSummary = outcomeSummary;
        payload.autoRequestTierReview = toBoolean(formValues.autoRequestTierReview, true);
        const requestTier = toTrimmedText(formValues.requestTier).toLowerCase();
        if (requestTier) payload.requestTier = requestTier;
        const requestRationale = toTrimmedText(formValues.requestRationale);
        if (requestRationale) payload.requestRationale = requestRationale;
        return { payload };
    }

    if (operation === 'request_mtss_tier_review') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        const requestedTier = validateRequiredText(formValues.requestedTier, 'Requested Tier');
        if (requestedTier.error) return { error: requestedTier.error };
        const rationale = validateRequiredText(formValues.rationale, 'Rationale');
        if (rationale.error) return { error: rationale.error };

        payload.assignmentId = assignmentId.value;
        payload.requestedTier = requestedTier.value.toLowerCase();
        payload.rationale = rationale.value;
        payload.priority = toTrimmedText(formValues.priority).toLowerCase() || DEFAULT_VALUES.priority;
        const evidence = toEvidenceListFromCsv(formValues.evidenceUrlsCsv);
        if (evidence.length > 0) payload.evidence = evidence;
        return { payload };
    }

    if (operation === 'assign_students_to_mtss_mentor') {
        const mentorId = validateRequiredText(formValues.mentorId, 'Mentor ID');
        if (mentorId.error) return { error: mentorId.error };
        const studentIds = toCsvList(formValues.studentIdsCsv);
        if (studentIds.length === 0) return { error: 'At least one Student ID is required.' };

        payload.mentorId = mentorId.value;
        payload.studentIds = studentIds;
        return { payload };
    }

    if (operation === 'assign_intervention_mentor') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        const mentorId = validateRequiredText(formValues.mentorId, 'Mentor ID');
        if (mentorId.error) return { error: mentorId.error };

        payload.assignmentId = assignmentId.value;
        payload.mentorId = mentorId.value;
        const subject = toTrimmedText(formValues.subject);
        if (subject) payload.subject = subject;
        return { payload };
    }

    if (operation === 'reassign_mtss_assignment_mentor') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        const mentorId = validateRequiredText(formValues.mentorId, 'New Mentor ID');
        if (mentorId.error) return { error: mentorId.error };

        payload.assignmentId = assignmentId.value;
        payload.mentorId = mentorId.value;
        const reason = toTrimmedText(formValues.reason);
        if (reason) payload.reason = reason;
        return { payload };
    }

    if (operation === 'update_mtss_assignment_status') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        const status = validateRequiredText(formValues.status, 'Status');
        if (status.error) return { error: status.error };

        payload.assignmentId = assignmentId.value;
        payload.status = status.value.toLowerCase();
        const summary = toTrimmedText(formValues.summary);
        if (summary) payload.summary = summary;
        const notes = toTrimmedText(formValues.notes);
        if (notes) payload.notes = notes;
        return { payload };
    }

    if (operation === 'update_mtss_goal_completion') {
        const assignmentId = validateRequiredText(formValues.assignmentId, 'Assignment ID');
        if (assignmentId.error) return { error: assignmentId.error };
        payload.assignmentId = assignmentId.value;

        const goalIndex = toNumberIfPossible(formValues.goalIndex);
        if (goalIndex !== null && Number.isInteger(goalIndex) && goalIndex >= 0) {
            payload.goalIndex = goalIndex;
        } else {
            const goalText = validateRequiredText(formValues.goalText, 'Goal Text');
            if (goalText.error) return { error: 'Goal Text is required when Goal Index is empty.' };
            payload.goalText = goalText.value;
        }

        payload.completed = toBoolean(formValues.completed, true);
        const summary = toTrimmedText(formValues.summary);
        if (summary) payload.summary = summary;
        return { payload };
    }

    return { error: `Unsupported operation "${operation}".` };
};

export const canExecuteAutomationRole = (role = '') => EXECUTE_AUTOMATION_ROLES.has(normalizeRoleName(role));

export const isOperationAllowedForRole = (role = '', operation = '') => {
    if (!canExecuteAutomationRole(role)) return false;
    return Boolean(OPERATION_CONFIG[String(operation || '').trim().toLowerCase()]);
};

export const getOperationLabel = (operation = '') =>
    OPERATION_CONFIG[String(operation || '').trim().toLowerCase()]?.label
    || String(operation || '').trim().replace(/_/g, ' ');

export const getDockOperationFormConfig = (operation = '', seedPayload = {}) => {
    const key = String(operation || '').trim().toLowerCase();
    const config = OPERATION_CONFIG[key];
    const fields = OPERATION_FORM_FIELDS[key];
    if (!config || !Array.isArray(fields)) return null;

    return {
        operation: key,
        label: config.label,
        description: config.description,
        fields: fields.map((field = {}) => ({
            key: String(field.key || ''),
            label: String(field.label || field.key || ''),
            type: String(field.type || 'text'),
            required: Boolean(field.required),
            placeholder: String(field.placeholder || ''),
            options: Array.isArray(field.options) ? field.options.slice(0, 8) : []
        })),
        initialValues: buildInitialFormValues(key, seedPayload)
    };
};

export const buildOperationPayloadFromForm = (operation = '', formValues = {}, seedPayload = {}) => {
    const key = String(operation || '').trim().toLowerCase();
    const result = validateOperationPayload(key, formValues || {}, seedPayload || {});
    if (result?.error) return { payload: null, error: String(result.error) };
    return { payload: result.payload || {}, error: '' };
};

export const detectDockOperationIntent = (message = '', { role = '', routeFamily = 'general' } = {}) => {
    if (!canExecuteAutomationRole(role)) return null;
    if (!['mtss', 'support_hub', 'emotional_dashboard', 'general'].includes(String(routeFamily || 'general'))) {
        return null;
    }

    const text = normalizeText(message);
    if (!text) return null;
    const hasActionCue = /(create|buat|bikin|assign|tetapkan|update|ubah|log|catat|submit|mark|ganti|reassign|clone|copy|upload|complete|request|ajukan|bulk|mass|batch)/i.test(text);
    const hasMtssCue = /(mtss|intervention|intervensi|mentor|assignment|goal|check[\s-]?in|progress|progres|evidence|bukti|tier|review)/i.test(text);
    if (!hasActionCue || !hasMtssCue) return null;

    for (const operation of OPERATION_ORDER) {
        const config = OPERATION_CONFIG[operation];
        if (config?.regex?.test(message)) {
            return {
                type: 'execute_operation',
                operation,
                payload: {},
                requireConfirmation: true,
                confirmText: `Run "${config.label}" now?`
            };
        }
    }

    return null;
};

export default {
    normalizeRoleName,
    canExecuteAutomationRole,
    isOperationAllowedForRole,
    getOperationLabel,
    getDockOperationFormConfig,
    buildOperationPayloadFromForm,
    detectDockOperationIntent
};
