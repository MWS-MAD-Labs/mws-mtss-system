import React, { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bell, Mail, ShieldCheck, MapPin, Tags, Handshake } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

function SectionRow({ icon: Icon, title, desc, enabled, onToggle, ariaId }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 backdrop-blur-xl transition-colors duration-300">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/30">
                    <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                    <p id={ariaId} className="text-sm font-medium text-foreground">
                        {title}
                    </p>
                    {desc ? (
                        <p className="text-xs text-muted-foreground">
                            {desc}
                        </p>
                    ) : null}
                </div>
            </div>

            <button
                role="switch"
                aria-checked={enabled}
                aria-labelledby={ariaId}
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ring-1 ring-border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${enabled ? "bg-accent" : "bg-muted/30"}`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-card-foreground shadow-sm transition-transform duration-300 ${enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );
}

export default function NotificationSettingsPage() {
    const reduce = useReducedMotion();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);

    const [nearbyJobs, setNearbyJobs] = useState(true);
    const [negotiationUpdates, setNegotiationUpdates] = useState(true);
    const [safetyAlerts, setSafetyAlerts] = useState(true);
    const [promotions, setPromotions] = useState(false);

    const [saving, setSaving] = useState(false);
    const [savedTs, setSavedTs] = useState(0);

    const container = useMemo(
        () => ({
            hidden: { opacity: 0, y: 8 },
            show: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: reduce ? 0 : 0.04 },
            },
        }),
        [reduce]
    );
    const item = useMemo(
        () => ({
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0, transition: { duration: 0.32 } },
        }),
        []
    );

    const onSave = useCallback(() => {
        setSaving(true);
        // Simulate persistence
        setTimeout(() => {
            setSaving(false);
            setSavedTs(Date.now());
            toast({ title: "Saved", description: "Notification preferences saved.", duration: 2000 });
        }, 500);
    }, [toast]);

    const lastSaved = useMemo(() => {
        if (!savedTs) return null;
        const d = new Date(savedTs);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }, [savedTs]);

    return (
        <AnimatedPage>
            <Helmet>
                <title>Notification Settings - MWS IntegraLearn</title>
            </Helmet>

            <MotionConfig reducedMotion="user">
                <motion.main
                    initial="hidden"
                    animate="show"
                    variants={container}
                    className="relative mx-auto max-w-lg px-3 sm:px-4 pb-16 pt-4 sm:pt-6"
                >
                    {/* Header */}
                    <motion.header variants={item} className="mb-5 sm:mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="rounded-full bg-card/30 backdrop-blur-md hover:bg-card/50 transition-colors duration-300"
                                aria-label="Kembali"
                            >
                                <Link to={-1}>
                                    <ArrowLeft className="h-5 w-5 text-foreground" />
                                </Link>
                            </Button>

                            <div>
                                <h1 className="text-base sm:text-lg font-semibold text-foreground">Pengaturan Notifikasi</h1>
                                <p className="text-[11px] sm:text-xs text-muted-foreground">
                                    Atur preferensi notifikasi kamu
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate("/notifications")}
                                className="rounded-full h-8 px-3 text-xs transition-colors duration-300"
                            >
                                Daftar Notifikasi
                            </Button>
                        </div>
                    </motion.header>

                    {/* Channels */}
                    <motion.section variants={item}>
                        <div className="mb-2 text-[11px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Kanal
                        </div>

                        <div className="grid gap-3">
                            <SectionRow
                                icon={Bell}
                                title="Push (Aplikasi)"
                                desc="Gunakan notifikasi dari aplikasi untuk info realtime."
                                enabled={pushEnabled}
                                onToggle={() => setPushEnabled((v) => !v)}
                                ariaId="push-toggle"
                            />

                            <SectionRow
                                icon={Mail}
                                title="Email"
                                desc="Kirim ringkasan dan pembaruan via email."
                                enabled={emailEnabled}
                                onToggle={() => setEmailEnabled((v) => !v)}
                                ariaId="email-toggle"
                            />
                        </div>
                    </motion.section>

                    {/* Types */}
                    <motion.section variants={item} className="mt-6">
                        <div className="mb-2 text-[11px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Jenis Notifikasi
                        </div>
                        <div className="grid gap-3">
                            <SectionRow
                                icon={MapPin}
                                title="Job Terdekat"
                                desc="Mendapatkan info job di sekitar lokasi kamu."
                                enabled={nearbyJobs}
                                onToggle={() => setNearbyJobs((v) => !v)}
                                ariaId="nearby-toggle"
                            />

                            <SectionRow
                                icon={Handshake}
                                title="Update Negosiasi"
                                desc="Perubahan penawaran/konter-penawaran dari lawan bicara."
                                enabled={negotiationUpdates}
                                onToggle={() => setNegotiationUpdates((v) => !v)}
                                ariaId="nego-toggle"
                            />

                            <SectionRow
                                icon={ShieldCheck}
                                title="Keamanan & Pembayaran"
                                desc="Kabar penting terkait KYC, deposit, escrow dan risiko."
                                enabled={safetyAlerts}
                                onToggle={() => setSafetyAlerts((v) => !v)}
                                ariaId="safety-toggle"
                            />

                            <SectionRow
                                icon={Tags}
                                title="Promo & Rekomendasi"
                                desc="Diskon, kode promo, dan rekomendasi yang dipersonalisasi."
                                enabled={promotions}
                                onToggle={() => setPromotions((v) => !v)}
                                ariaId="promo-toggle"
                            />
                        </div>
                    </motion.section>

                    {/* Footer actions */}
                    <motion.section variants={item} className="mt-6 flex items-center justify-between">
                        <div className="text-[11px] sm:text-xs text-muted-foreground">
                            {saving ? "Saving..." : lastSaved ? `Saved • ${lastSaved}` : "No changes yet"}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full h-8 px-3 text-xs"
                                onClick={() => {
                                    // reset to defaults (demo)
                                    setPushEnabled(true);
                                    setEmailEnabled(true);
                                    setNearbyJobs(true);
                                    setNegotiationUpdates(true);
                                    setSafetyAlerts(true);
                                    setPromotions(false);
                                    setSavedTs(0);
                                }}
                            >
                                Reset
                            </Button>

                            <Button
                                size="sm"
                                onClick={onSave}
                                disabled={saving}
                                className="rounded-full h-8 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
                            >
                                Simpan
                            </Button>
                        </div>
                    </motion.section>
                </motion.main>
            </MotionConfig>
        </AnimatedPage>
    );
}
