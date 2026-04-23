import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Heart,
    Sparkles,
    Sun,
    Cloud,
    CloudRain,
    Zap,
    Wind,
    Snowflake,
    Rainbow,
    Droplets,
    Flower2,
    Brain,
    UserRoundCheck,
    Home
} from "lucide-react";
import { sanitizeInput } from "@/lib/ratingUtils";
import { Button } from "@/components/ui/button";

const moodBadgeMap = {
    positive: { label: "You're doing great", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    balanced: { label: "Steady and okay", className: "bg-sky-100 text-sky-700 border-sky-200" },
    challenging: { label: "Needs gentle support", className: "bg-amber-100 text-amber-700 border-amber-200" },
    depleted: { label: "Take recovery time", className: "bg-rose-100 text-rose-700 border-rose-200" }
};

const weatherIconMap = {
    sunny: Sun,
    "partly-cloudy": Cloud,
    "light-rain": CloudRain,
    thunderstorms: Zap,
    tornado: Wind,
    snowy: Snowflake,
    rainbow: Rainbow,
    foggy: Droplets,
    heatwave: Sun,
    windy: Wind
};

const recommendationIconMap = {
    school: Brain,
    selfcare: Flower2,
    "self-care": Flower2,
    connection: UserRoundCheck,
    mindfulness: Sparkles,
    support: Heart,
    reflection: Brain
};

const metricTone = (score = 0) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-sky-600";
    return "text-amber-600";
};

const StudentResultView = memo(({ checkInData, analysis, recommendations = [], displayName }) => {
    const moodBadge = moodBadgeMap[analysis?.emotionalState] || moodBadgeMap.balanced;
    const WeatherIcon = weatherIconMap[analysis?.weatherValue || checkInData?.weatherType] || Cloud;
    const shortName = useMemo(() => {
        const raw = String(displayName || checkInData?.nickname || checkInData?.name || "Student").trim();
        if (!raw) return "Student";
        return raw.split(/\s+/)[0];
    }, [displayName, checkInData?.nickname, checkInData?.name]);

    const normalizedRecommendations = useMemo(() => {
        if (Array.isArray(recommendations) && recommendations.length) return recommendations.slice(0, 4);
        return [
            {
                title: "Breathe and Reset",
                description: "Try 5 slow breaths. Inhale 4 counts, exhale 6 counts.",
                category: "mindfulness"
            },
            {
                title: "Do One Tiny Task",
                description: "Finish one simple school task to rebuild momentum.",
                category: "school"
            },
            {
                title: "Talk to Someone You Trust",
                description: "Share your feelings with your teacher or school psychologist.",
                category: "connection"
            },
            {
                title: "Small Self-Care Break",
                description: "Drink water, stretch, and give yourself 2 minutes of calm.",
                category: "self-care"
            }
        ];
    }, [recommendations]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 dark:from-background dark:via-background dark:to-background text-foreground">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full blur-3xl bg-pink-300/25" />
                <div className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full blur-3xl bg-sky-300/25" />
                <div className="absolute top-1/3 left-1/2 w-56 h-56 rounded-full blur-3xl bg-amber-300/20" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-pink-400 to-violet-500 text-white flex items-center justify-center shadow-lg">
                        <Heart className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        Great job, {sanitizeInput(shortName)}!
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                        Your emotional check-in is complete. Here is a kind snapshot of how you are feeling today.
                    </p>
                    <div className={`mt-4 inline-flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs font-bold ${moodBadge.className}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{moodBadge.label}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                    <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Internal Weather</p>
                        <div className="flex items-center gap-2">
                            <WeatherIcon className="w-5 h-5 text-amber-500" />
                            <p className="font-bold capitalize">{checkInData?.weatherType || "partly-cloudy"}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Presence</p>
                        <p className={`text-2xl font-black ${metricTone(checkInData?.presenceLevel)}`}>
                            {checkInData?.presenceLevel || 0}/10
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Capacity</p>
                        <p className={`text-2xl font-black ${metricTone(checkInData?.capacityLevel)}`}>
                            {checkInData?.capacityLevel || 0}/10
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="rounded-2xl border border-white/50 dark:border-white/10 bg-gradient-to-br from-white/85 to-white/65 dark:from-white/10 dark:to-white/5 backdrop-blur-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-violet-500" />
                        <h2 className="text-lg font-bold">Psychologist Insight For You</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/85">
                        {analysis?.psychologicalInsights || "You are building emotional awareness. That is a strong and healthy skill."}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                    className="space-y-3"
                >
                    <h2 className="text-lg sm:text-xl font-black text-center">Recommendations Just For You</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {normalizedRecommendations.map((rec, idx) => {
                            const key = String(rec.category || "").toLowerCase();
                            const RecIcon = recommendationIconMap[key] || Sparkles;
                            return (
                                <div
                                    key={`${rec.title}-${idx}`}
                                    className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/5 backdrop-blur-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-900/40 dark:to-rose-900/40 flex items-center justify-center">
                                            <RecIcon className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                                        </div>
                                        <p className="font-bold text-sm">{rec.title}</p>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                        {rec.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3 }}
                    className="rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-900/15 backdrop-blur-xl p-4"
                >
                    <div className="flex items-start gap-2">
                        <UserRoundCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                                Support Is Always Available
                            </p>
                            <p className="text-xs sm:text-sm text-emerald-700/90 dark:text-emerald-200/90 mt-1">
                                {checkInData?.supportPerson && checkInData.supportPerson !== "No Need"
                                    ? `Thanks for selecting ${sanitizeInput(checkInData.supportPerson)}. Your trusted support team is here for you.`
                                    : "You can always talk to your homeroom teacher, SE teacher, principal, or school psychologist when needed."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.35 }}
                    className="flex justify-center pt-2"
                >
                    <Link to="/profile" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-2xl px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:opacity-95">
                            <span className="inline-flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Back to Profile
                            </span>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
});

StudentResultView.displayName = "StudentResultView";

export default StudentResultView;
