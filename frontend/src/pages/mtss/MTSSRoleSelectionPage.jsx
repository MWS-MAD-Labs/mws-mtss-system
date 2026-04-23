import React, { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { roles } from "./data/roleSelectionOptions";
import RoleSelectionCard from "./components/RoleSelectionCard";

const MTSSRoleSelectionPage = memo(() => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useSelector((state) => state.auth);
    const isAdminPrincipal = useMemo(
        () => ["admin", "superadmin", "head_unit", "directorate"].includes(currentUser?.role),
        [currentUser?.role],
    );

    const visibleRoles = useMemo(() => {
        if (!isAdminPrincipal) return roles;
        return roles.filter((role) => role.key !== "family");
    }, [isAdminPrincipal]);

    const handleSelect = (key) => {
        if (key === "teacher") {
            navigate("/mtss/teacher");
            return;
        }
        if (key === "admin") {
            navigate("/mtss/admin");
            return;
        }
        if (key === "family") {
            navigate("/mtss/student-portal");
            return;
        }
        toast({
            title: "Coming soon",
            description: "This role is currently in design. Please use the main dashboard for now.",
        });
    };

    return (
        <div className="mtss-theme mtss-animated-bg min-h-screen relative overflow-hidden text-foreground dark:text-white transition-colors">
            <div className="mtss-bg-overlay" />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-30%] left-[-10%] w-[60vmin] h-[60vmin] bg-primary/20 blur-[200px]" />
                <div className="absolute top-[10%] right-[-10%] w-[45vmin] h-[45vmin] bg-gold/25 blur-[200px]" />
                <div className="absolute bottom-[-20%] left-1/3 w-[50vmin] h-[50vmin] bg-emerald/20 blur-[200px]" />
            </div>

            <div className="relative z-20 container-tight py-10 md:py-14">
                <div className="text-center max-w-5xl mx-auto mb-10 md:mb-12 space-y-4 px-4" data-aos="fade-down">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full shadow-lg mx-auto" style={{ background: "var(--mtss-chip-gradient)" }}>
                        <Shield className="w-4 h-4 text-white drop-shadow" />
                        <span className="text-xs font-black tracking-[0.5em] text-white uppercase">Roles Playground</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black mb-1 drop-shadow-lg tracking-tight leading-tight">
                            <span className="mtss-gradient-text" style={{ backgroundImage: "var(--mtss-heading-gradient-primary)" }}>
                                Multi-Tiered System
                            </span>{" "}
                            <span className="mtss-gradient-text" style={{ backgroundImage: "var(--mtss-heading-gradient-secondary)" }}>
                                of Support
                            </span>
                        </h1>
                        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                            <span className="mtss-gradient-text" style={{ backgroundImage: "var(--mtss-heading-gradient-secondary)" }}>
                                Pick your lane
                            </span>{" "}
                            <span className="mtss-ink-soft">
                                and jump right into bright dashboards built for joyful interventions.
                            </span>
                        </p>
                    </div>
                    {isAdminPrincipal && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={() => navigate("/profile")}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 dark:bg-white/10 border border-white/60 dark:border-white/20 shadow-md text-sm font-semibold text-slate-700 dark:text-white hover:-translate-y-0.5 transition"
                                data-aos="zoom-in"
                                data-aos-delay="80"
                            >
                                Go to Profile
                                <Sparkles className="w-4 h-4 text-primary" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid gap-5 sm:gap-6 md:gap-7 grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto px-4">
                    {visibleRoles.map((role, index) => (
                        <RoleSelectionCard key={role.key} role={role} onClick={handleSelect} delay={index * 120} />
                    ))}
                </div>

                <div className="mt-10 md:mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass glass-card mtss-card-surface p-6 text-foreground dark:text-white/90 mx-4" data-aos="fade-up">
                    <div className="flex items-start gap-3">
                        <Users className="w-6 h-6 text-gold animate-pulse drop-shadow mt-0.5" />
                        <div>
                            <p className="text-sm uppercase tracking-[0.4em] mtss-gradient-text" style={{ backgroundImage: "var(--mtss-team-spark-gradient)" }}>
                                Team Spark
                            </p>
                            <p className="text-base font-semibold mtss-ink">
                                Connect counselors, homeroom squads, and families in one tap.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-6 h-6 text-emerald animate-bounce drop-shadow mt-0.5" />
                        <div>
                            <p className="text-sm uppercase tracking-[0.4em] mtss-gradient-text" style={{ backgroundImage: "var(--mtss-team-clarity-gradient)" }}>
                                Clarity
                            </p>
                            <p className="text-base font-semibold mtss-ink">
                                Every plan, note, and celebration in a single playful view.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

MTSSRoleSelectionPage.displayName = "MTSSRoleSelectionPage";
export default MTSSRoleSelectionPage;
