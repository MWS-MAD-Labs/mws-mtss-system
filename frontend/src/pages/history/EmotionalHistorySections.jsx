import React, { memo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const HistoryHeader = memo(({ onBack, itemVariants }) => (
    <motion.header variants={itemVariants} className="mb-6 flex items-center gap-3">
        <button
            onClick={onBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/40 backdrop-blur-md hover:bg-accent/8 transition-colors duration-300"
        >
            <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Emotional History</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Reflection & thoughts</p>
        </div>
    </motion.header>
));

export const HistoryList = memo(({ reflections, itemVariants }) => {
    if (!reflections.length) {
        return (
            <Card className="glass glass-card">
                <CardContent className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">No History Yet</h3>
                    <p className="text-foreground/70 text-sm">
                        You haven't completed any emotional check-ins or added reflections yet.
                        Start with daily check-ins to see your history here.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.section variants={itemVariants}>
            <div className="space-y-4">
                {reflections.map((reflection) => (
                    <Card key={reflection.id} className="glass glass-card">
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">{reflection.date}</span>
                                        <span className="text-xs text-muted-foreground">{reflection.time}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">{reflection.weatherType}</Badge>
                                </div>

                                <div className="bg-secondary/20 rounded-lg p-3">
                                    <p className="text-sm text-foreground leading-relaxed">{reflection.details}</p>
                                </div>

                                {reflection.moods.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {reflection.moods.map((mood) => (
                                            <Badge key={mood} variant="secondary" className="text-xs">{mood}</Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-foreground/70 pt-2 border-t border-border/50">
                                    <span>Presence: {reflection.presenceLevel}/10</span>
                                    <span>Capacity: {reflection.capacityLevel}/10</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </motion.section>
    );
});

export const HistorySummary = memo(({ reflections, avgPresence, itemVariants }) => {
    if (!reflections.length) return null;

    return (
        <motion.section variants={itemVariants} className="mt-6">
            <Card className="glass glass-card">
                <CardHeader>
                    <CardTitle>History Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{reflections.length}</div>
                            <div className="text-xs text-foreground/70">Total Reflections</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{avgPresence}</div>
                            <div className="text-xs text-foreground/70">Average Presence</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.section>
    );
});
