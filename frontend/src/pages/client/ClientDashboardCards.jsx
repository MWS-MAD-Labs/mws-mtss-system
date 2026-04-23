import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const cn = (...c) => c.filter(Boolean).join(" ");
const badgeClass = (status) =>
    status === "In Progress"
        ? "bg-primary/15 text-primary ring-1 ring-primary/20"
        : status === "Review"
            ? "bg-accent/15 text-accent ring-1 ring-accent/20"
            : "bg-muted text-muted-foreground ring-1 ring-border/10";

export const KpiCard = memo(({ icon: Icon, label, value }) => (
    <Card className="rounded-2xl border border-border/40 glass-strong hover-card">
        <CardContent className="flex items-center gap-3 p-3">
            <div className="rounded-lg p-2 flex items-center justify-center min-w-[36px] h-10 border border-border/50 bg-background/30">
                <Icon className="h-4 w-4 text-accent" aria-hidden />
            </div>
            <div className="leading-tight min-w-0">
                <p className="text-[11px] uppercase text-muted-foreground truncate">{label}</p>
                <p className="text-lg font-semibold truncate">{value}</p>
            </div>
        </CardContent>
    </Card>
));

export const QuickActionCard = memo(({ action }) => {
    const Icon = action.icon;
    return (
        <Link to={action.path} aria-label={action.title} className="group block">
            <Card className="rounded-2xl border border-border/40 glass-strong hover-card">
                <CardContent className="flex min-h-[88px] sm:min-h-[96px] flex-col items-center justify-center gap-2 p-3">
                    <div className="rounded-xl p-2 border border-border/50 bg-background/50 transition-transform group-hover:scale-105 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-accent" aria-hidden />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-center leading-snug line-clamp-2 break-words">{action.title}</p>
                </CardContent>
            </Card>
        </Link>
    );
});

export const ActiveJobCard = memo(({ job }) => (
    <Link to={`/job/${job.id}/track`} className="group block" aria-label={`View ${job.title}`}>
        <Card className="rounded-2xl border border-border/40 glass-strong hover-card">
            <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm sm:text-base font-semibold text-foreground group-hover:text-accent transition-colors duration-320">
                            {job.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Worker: <span className="font-medium text-foreground">{job.worker}</span>
                        </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", badgeClass(job.status))}>{job.status}</span>
                </div>

                <div>
                    <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>Progress</span>
                        <span className="text-xs font-medium text-foreground">{job.progress}%</span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={100}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    </Link>
));
