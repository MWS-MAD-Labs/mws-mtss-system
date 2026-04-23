import React, { memo } from "react";
import { motion } from "framer-motion";
import { X, Award, BookOpen, Users, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid } from "recharts";
import { TierPill, ProgressBadge } from "./StatusPills";

const ModalShell = ({ children, onClose }) => (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 mtss-theme">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh]"
            role="dialog"
            aria-modal="true"
        >
            {children}
        </motion.div>
    </div>
);

const StudentProfileModal = memo(({ student, onClose }) => {
    if (!student) return null;
    const profile = student.profile || {};
    const chartData = profile.chart || [];
    const history = profile.history || [];

    return (
        <ModalShell onClose={onClose}>
            <div className="glass glass-card mtss-card-surface rounded-[32px] h-full overflow-hidden flex flex-col border border-primary/15 mtss-liquid">
                <div className="bg-gradient-to-r from-[#ff58c2]/80 via-[#a855f7]/80 to-[#6366f1]/80 text-white p-6 flex items-start justify-between flex-shrink-0">
                    <div>
                        <p className="uppercase text-xs tracking-[0.4em] opacity-80 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Student Profile
                        </p>
                        <h2 className="text-3xl font-extrabold drop-shadow-sm">{student.name}</h2>
                        <p className="text-sm opacity-90 mt-2">
                            Grade {student.grade} &middot; Current Tier <TierPill tier={student.tier} />
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full bg-white/30 p-2 text-white hover:bg-white/50 transition" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scroll">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/85 to-[#fff0f8] border border-border/30">
                            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Student Info</p>
                            <ul className="mt-3 text-sm space-y-1 text-foreground">
                                <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Teacher: {profile.teacher || "N/A"}</li>
                                <li className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald" /> Mentor: {profile.mentor || "N/A"}</li>
                                <li className="flex items-center gap-2"><Award className="w-4 h-4 text-gold" /> Duration: {profile.duration || "—"}</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/85 to-[#f0f5ff] border border-border/30">
                            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Intervention</p>
                            <p className="mt-3 text-sm text-foreground">{profile.strategy || "Individualized plan coming soon."}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/85 to-[#fff6e5] border border-border/30">
                            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Progress Summary</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-semibold">
                                <div className="rounded-xl bg-primary/10 text-primary py-2">Baseline<br />{profile.baseline ?? "—"}</div>
                                <div className="rounded-xl bg-emerald/10 text-emerald py-2">Current<br />{profile.current ?? "—"}</div>
                                <div className="rounded-xl bg-gold/10 text-gold py-2">Target<br />{profile.target ?? "—"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/30 p-4 bg-white/90 dark:bg-white/5">
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                                <XAxis dataKey="label" stroke="rgba(100,116,139,0.9)" />
                                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,0.3)" }} />
                                <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={3} dot={{ r: 5 }} />
                                <Line type="monotone" dataKey="goal" stroke="#fbbf24" strokeDasharray="5 4" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                <div className="rounded-2xl border border-border/30 p-4 bg-white/80 dark:bg-white/10">
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">Progress History</p>
                    <div className="space-y-3">
                        {history.map((item, idx) => (
                            <div key={idx} className="rounded-2xl border border-border/60 p-3 flex flex-wrap items-center gap-3 bg-background/60">
                                <div className="text-sm font-semibold w-28">{item.date}</div>
                                <div className="text-sm flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    Score: {item.score}
                                </div>
                                <ProgressBadge status={student.progress} />
                                <p className="text-sm text-muted-foreground flex-1">{item.notes}</p>
                            </div>
                        ))}
                        {!history.length && <p className="text-sm text-muted-foreground">No history recorded yet.</p>}
                    </div>
                </div>
                </div>
            </div>
        </ModalShell>
    );
});

StudentProfileModal.displayName = "StudentProfileModal";
export default StudentProfileModal;
