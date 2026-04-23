import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AnimatedPage from "@/components/AnimatedPage";
import { Helmet } from "react-helmet";

// Badge list with status
const badges = [
    {
        icon: Star,
        name: "New Worker",
        desc: "Complete 1 job",
        status: "new",
    },
    {
        icon: TrendingUp,
        name: "Diligent",
        desc: "Complete 10 jobs",
        status: "earned",
    },
    {
        icon: Award,
        name: "Expert",
        desc: "Complete 50 jobs",
        status: "locked",
    },
    {
        icon: ShieldCheck,
        name: "Trusted",
        desc: "Rating 4.8+ after 20 jobs",
        status: "earned",
    },
];

const GamificationPage = () => {
    const userLevel = 5;
    const userXP = 350;
    const xpToNextLevel = 500;
    const progress = (userXP / xpToNextLevel) * 100;

    // Animasi unik per badge
    const animations = {
        new: {
            animate: { scale: [1, 1.3, 1], y: [0, -6, 0] },
            transition: { duration: 0.6, repeat: 2, ease: "easeInOut" },
        },
        earnedTrending: {
            whileHover: { rotate: [0, -10, 10, 0], transition: { duration: 0.5 } },
        },
        earnedShield: {
            whileHover: { rotate: 360, transition: { duration: 0.8 } },
        },
        locked: {},
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Levels & Badges — MWS IntegraLearn</title>
                <meta
                    name="description"
                    content="See your progress, levels, and the badges you’ve earned."
                />
            </Helmet>

            <div className="relative min-h-dvh w-full px-4 py-6 space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3"
                >
                    <Link to={-1}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-card/40 backdrop-blur-md ring-1 ring-border text-muted-foreground hover:text-accent-foreground hover:bg-accent/20 transition-all duration-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <span className="text-accent">★</span> Levels & Badges
                    </h1>
                </motion.div>

                {/* Level Card */}
                <Card className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl">
                    <CardContent className="space-y-6 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-foreground">
                                Level {userLevel}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {userXP} / {xpToNextLevel} XP
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="relative w-full h-4 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                className="absolute top-0 left-0 h-4 rounded-full bg-gradient-to-r from-primary via-accent to-secondary shadow-inner"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            Complete jobs to level up 🚀
                        </p>
                    </CardContent>
                </Card>

                {/* Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <h2 className="mb-4 text-lg font-semibold text-foreground">
                        My Badges
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {badges.map((badge, index) => {
                            const isNew = badge.status === "new";
                            const isEarned = badge.status === "earned";
                            const isLocked = badge.status === "locked";

                            // Tentukan animasi icon
                            let iconProps = {};
                            if (isNew) iconProps = animations.new;
                            if (isEarned && badge.icon === TrendingUp)
                                iconProps = animations.earnedTrending;
                            if (isEarned && badge.icon === ShieldCheck)
                                iconProps = animations.earnedShield;

                            return (
                                <motion.div
                                    key={badge.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.35, delay: index * 0.1 }}
                                >
                                    <Card
                                        className={`rounded-2xl border backdrop-blur-lg transition-all duration-300 ${isLocked
                                                ? "bg-muted/40 border-border opacity-60"
                                                : "bg-card/70 border-primary/40 shadow-md hover:shadow-lg hover:scale-105"
                                            }`}
                                    >
                                        <CardContent className="p-5 text-center space-y-3">
                                            {/* Icon */}
                                            <motion.div {...iconProps}>
                                                <badge.icon
                                                    className={`mx-auto h-10 w-10 ${isLocked
                                                            ? "text-muted-foreground"
                                                            : "text-yellow-400"
                                                        }`}
                                                />
                                            </motion.div>

                                            {/* Text */}
                                            <p
                                                className={`font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"
                                                    }`}
                                            >
                                                {badge.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {badge.desc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatedPage>
    );
};

export default GamificationPage;
