import { memo } from "react";
import { ProgressBadge } from "./StatusPills";
import { TIER_CONFIG } from "../config/studentProfileConfig";

const StudentProfileHeader = memo(({
    student,
    highlight,
    currentTier,
    currentInterventionLabel,
}) => {
    const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.tier1;
    const classLabel = student.className && student.className !== student.grade ? student.className : null;

    return (
        <div className="relative overflow-hidden text-white">
            <div className="absolute inset-0 mtss-hero-gradient" />
            <div className="absolute inset-0 mtss-hero-aurora opacity-80" />
            <div className="absolute inset-0 mtss-hero-shine hidden sm:block" />

            <div className="relative px-3.5 py-3 sm:px-8 sm:py-8">
                {/* Mobile: compact vertical stack */}
                <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
                    {/* Name & meta */}
                    <div className="space-y-1 sm:space-y-3">
                        <span className="mtss-chip bg-white/15 text-white/90 text-[9px] sm:text-xs">
                            Student Spotlight
                        </span>
                        <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-tight">{student.name}</h1>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-semibold text-white/90">
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15">
                                {student.grade || "-"}
                            </span>
                            {classLabel && (
                                <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10">
                                    {classLabel}
                                </span>
                            )}
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10">
                                {highlight?.label || "Universal Supports"}
                            </span>
                        </div>
                    </div>

                    {/* Badges row — horizontal scroll on mobile to avoid wrap */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-slim pb-1 -mx-0.5 px-0.5">
                        <span className={`flex-shrink-0 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold bg-gradient-to-r ${tierConfig.gradient} shadow-lg`}>
                            {tierConfig.label}
                        </span>
                        <span className="flex-shrink-0 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-semibold bg-white/15 backdrop-blur-sm">
                            {currentInterventionLabel || highlight?.label || "Universal"}
                        </span>
                        <div className="flex-shrink-0">
                            <ProgressBadge status={student.progress} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

StudentProfileHeader.displayName = "StudentProfileHeader";
export default StudentProfileHeader;
