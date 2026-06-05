const LAST_UPDATE_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const toTimestamp = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    const timestamp = parsed.getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
};

const trimLabel = (value) => {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized || null;
};

export const resolveAssignmentSubjectLabel = (assignmentOption = {}) => {
    const candidates = [
        assignmentOption?.lastUpdateSubject,
        assignmentOption?.focus,
        ...(Array.isArray(assignmentOption?.focusAreas) ? assignmentOption.focusAreas : []),
        assignmentOption?.strategyName,
    ];

    for (const candidate of candidates) {
        const label = trimLabel(candidate);
        if (label) return label;
    }

    return null;
};

export const normalizeLastUpdate = (value = null) => {
    if (!value || typeof value !== "object") return null;
    const at = trimLabel(value.at || value.date || value.updatedAt || value.lastUpdatedAt);
    const timestamp = toTimestamp(at);
    if (!timestamp) return null;

    return {
        at: new Date(timestamp).toISOString(),
        subject: trimLabel(value.subject),
        timestamp,
    };
};

export const resolveStudentLastUpdate = (student = {}) => {
    const directLastUpdate = normalizeLastUpdate(student?.lastUpdate);
    const assignmentLastUpdate = Array.isArray(student?.assignmentOptions)
        ? student.assignmentOptions
              .map((option) => {
                  const at = option?.lastUpdateAt || option?.updatedAt || option?.lastPlanUpdatedAt || option?.createdAt || option?.startDate;
                  const timestamp = toTimestamp(at);
                  if (!timestamp) return null;
                  return {
                      at: new Date(timestamp).toISOString(),
                      subject: resolveAssignmentSubjectLabel(option),
                      timestamp,
                  };
              })
              .filter(Boolean)
              .sort((left, right) => right.timestamp - left.timestamp)[0] || null
        : null;

    if (!directLastUpdate) return assignmentLastUpdate;
    if (!assignmentLastUpdate) return directLastUpdate;

    if (assignmentLastUpdate.timestamp >= directLastUpdate.timestamp) {
        return {
            ...assignmentLastUpdate,
            subject: assignmentLastUpdate.subject || directLastUpdate.subject || null,
        };
    }

    return {
        ...directLastUpdate,
        subject: directLastUpdate.subject || assignmentLastUpdate.subject || null,
    };
};

export const formatLastUpdateDate = (value) => {
    const timestamp = toTimestamp(value);
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (date.getFullYear() < 2020) return null;
    return LAST_UPDATE_DATE_FORMATTER.format(date);
};

export const formatUpdateDateLabel = (value, fallback = null) => {
    const formattedDate = formatLastUpdateDate(value);
    if (formattedDate) return formattedDate;

    const rawLabel = trimLabel(typeof value === "string" ? value : null);
    return rawLabel || fallback;
};

export const getStudentLastUpdateDisplay = (student = {}) => {
    const lastUpdate = resolveStudentLastUpdate(student);

    return {
        dateLabel: formatUpdateDateLabel(lastUpdate?.at),
        subjectLabel: trimLabel(lastUpdate?.subject),
    };
};

export const getStudentNextUpdateDisplay = (student = {}) => {
    const primaryAssignment = Array.isArray(student?.assignmentOptions)
        ? student.assignmentOptions[0] || null
        : null;

    return {
        dateLabel: formatUpdateDateLabel(student?.nextUpdate, "Not scheduled"),
        subjectLabel: resolveAssignmentSubjectLabel(primaryAssignment),
    };
};

export const formatStudentLastUpdate = (student = {}) => {
    const { dateLabel, subjectLabel } = getStudentLastUpdateDisplay(student);
    if (!dateLabel) return null;
    return subjectLabel ? `${dateLabel} - ${subjectLabel}` : dateLabel;
};
