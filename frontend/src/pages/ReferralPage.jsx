// src/pages/ReferralPage.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Gift, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import AnimatedPage from "@/components/AnimatedPage";
import { Helmet } from "react-helmet";
import confetti from "canvas-confetti";

export default function ReferralPage() {
    const { toast } = useToast();
    const referralCode = "KERJAIN-AJA-123";

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        toast({
            title: "Kode Disalin ✅",
            description: "Bagikan kode referral sekarang ✨",
        });
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#a855f7", "#facc15", "#ffffff"],
        });
        toast({
            title: "Siap Dibagikan 🎉",
            description: "Kode referral berhasil dibagikan.",
        });
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Undang Teman — Kerjain</title>
                <meta
                    name="description"
                    content="Undang teman ke Kerjain dan dapatkan bonus setiap kali mereka bergabung dan menyelesaikan pekerjaan."
                />
            </Helmet>

            <div className="relative min-h-dvh w-full px-4 py-6 md:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="mb-8 flex items-center gap-3"
                >
                    <Link to={-1}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full border border-border/50 bg-card/40 backdrop-blur-xl hover:bg-accent/20 hover:text-accent-foreground transition-colors duration-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">Undang Teman</h1>
                </motion.div>

                {/* Bonus Card */}
                <Card className="mb-8 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <CardContent className="space-y-4 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 240,
                                damping: 20,
                                delay: 0.2,
                            }}
                        >
                            <Gift className="mx-auto h-20 w-20 text-accent drop-shadow-lg" />
                        </motion.div>
                        <h2 className="text-xl font-bold">Bonus Rp 25.000 🎁</h2>
                        <p className="mx-auto max-w-md text-sm text-muted-foreground">
                            Ajak teman gabung, nikmati saldo bonus saat mereka selesaikan job
                            pertama.
                        </p>
                    </CardContent>
                </Card>

                {/* Referral Code */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-4 text-center"
                >
                    <p className="text-sm font-medium text-muted-foreground">
                        Kode Referral Anda
                    </p>
                    <div className="relative mx-auto max-w-sm">
                        <Input
                            readOnly
                            value={referralCode}
                            className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md text-center font-mono text-base tracking-widest focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border/40 bg-secondary/40 backdrop-blur hover:bg-secondary/60 transition-all duration-300"
                            onClick={copyCode}
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>

                    <Button
                        onClick={triggerConfetti}
                        className="mt-4 w-full rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all duration-350 hover:bg-accent hover:text-accent-foreground hover:shadow-lg"
                    >
                        <Share2 className="mr-2 h-5 w-5" /> Bagikan Sekarang
                    </Button>
                </motion.div>
            </div>
        </AnimatedPage>
    );
}
