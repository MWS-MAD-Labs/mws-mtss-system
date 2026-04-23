import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, Clock, MessageSquare, CheckCircle2, Loader2, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedPage from "@/components/AnimatedPage";
import EmptyState from "@/components/feedback/EmptyState";
import { activeJobs, quickActions } from "@/pages/client/clientDashboardData";
import { ActiveJobCard, KpiCard, QuickActionCard } from "@/pages/client/ClientDashboardCards";

export default function ClientDashboard() {
    const reduce = useReducedMotion();

    const kpis = useMemo(
        () => [
            { label: "Active", value: activeJobs.length, icon: Loader2 },
            { label: "Completed", value: 12, icon: CheckCircle2 },
            { label: "Chat", value: 3, icon: MessageSquare },
            { label: "Draft", value: 1, icon: Clock },
        ],
        []
    );

    return (
        <AnimatedPage>
            <Helmet>
                <title>Client Dashboard - MWS IntegraLearn</title>
            </Helmet>

            <div className="relative min-h-screen w-full px-3 py-5 sm:px-6 sm:py-6 text-foreground">
                <motion.header initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-5">
                    <div className="rounded-3xl border border-border/40 glass-strong shadow-sm p-3 sm:p-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                                <User className="h-5 w-5" aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-xl font-semibold truncate">Hello, Jilliyan 👋</h1>
                                <p className="text-xs text-muted-foreground truncate">Hope your day is going well</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to="/post-job">
                                <Button size="sm" className="hidden sm:inline-flex rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition duration-320">
                                    <Plus className="mr-2 h-4 w-4" /> Post
                                </Button>
                            </Link>

                            <Link to="/post-job" aria-label="Posting" className="sm:hidden">
                                <Button size="icon" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition duration-320">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.header>

                <section className="mb-4">
                    <div className="hidden sm:grid grid-cols-4 gap-3">
                        {kpis.map((k) => <KpiCard key={k.label} icon={k.icon} label={k.label} value={k.value} />)}
                    </div>

                    <div className="sm:hidden">
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                            {kpis.map((k) => (
                                <div key={k.label} className="min-w-[140px]">
                                    <KpiCard icon={k.icon} label={k.label} value={k.value} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-2">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Quick Actions</h2>
                        <Link to="/history" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            All <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {quickActions.map((a) => <QuickActionCard key={a.title} action={a} />)}
                    </div>
                </section>

                <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Active Jobs</h2>
                        {activeJobs.length > 0 && <p className="text-xs text-muted-foreground">{activeJobs.length} jobs</p>}
                    </div>

                    {activeJobs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {activeJobs.map((j) => <ActiveJobCard key={j.id} job={j} />)}
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
                            <EmptyState
                                title="No active jobs yet."
                                subtitle="Create a new post to start finding workers."
                                action={
                                    <Link to="/post-job">
                                        <Button size="sm" className="font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition duration-320">
                                            <Plus className="mr-2 h-4 w-4" /> Post Job
                                        </Button>
                                    </Link>
                                }
                            />
                        </motion.div>
                    )}
                </section>

                <div className="h-10" />
            </div>
        </AnimatedPage>
    );
}
