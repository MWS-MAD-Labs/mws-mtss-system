import { memo } from "react";

const StudentUpdateValue = memo(({ dateLabel, subjectLabel, emptyLabel, compact = false }) => {
    const hasDate = Boolean(dateLabel);
    const displayDate = hasDate ? dateLabel : emptyLabel;
    const dateSizeClass = compact ? "text-[10px]" : "text-[12px]";
    const subjectSizeClass = compact ? "text-[9px]" : "text-[10px]";
    const title = subjectLabel && hasDate ? `${dateLabel} - ${subjectLabel}` : displayDate;

    return (
        <div className="min-w-0">
            <p
                className={`${dateSizeClass} font-medium truncate ${hasDate ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}
                title={title}
            >
                {displayDate}
            </p>
            {subjectLabel ? (
                <p
                    className={`${subjectSizeClass} text-indigo-500 dark:text-indigo-400 font-medium truncate mt-0.5`}
                    title={subjectLabel}
                >
                    {subjectLabel}
                </p>
            ) : null}
        </div>
    );
});

StudentUpdateValue.displayName = "StudentUpdateValue";

export default StudentUpdateValue;
