import { GraduationCap, Building2, Handshake } from "lucide-react";

export const roles = [
    {
        key: "teacher",
        title: "Teacher / Mentor",
        icon: GraduationCap,
        description: "Craft playful tiered boosts, log sparks, and ping families with cheerful wins.",
        gradient: "var(--mtss-role-card-teacher)",
        titleGradient: "var(--mtss-role-title-teacher)",
        buttonGradient: "var(--mtss-role-pill-teacher)",
        textColor: "var(--mtss-role-ink-teacher)",
        badge: "Active Journey",
    },
    {
        key: "admin",
        title: "Admin / Principal",
        icon: Building2,
        description: "Map campus-wide momentum, assign mentors, and peek at vibrant analytics.",
        gradient: "var(--mtss-role-card-admin)",
        titleGradient: "var(--mtss-role-title-admin)",
        buttonGradient: "var(--mtss-role-pill-admin)",
        textColor: "var(--mtss-role-ink-admin)",
        badge: "Preview Access",
    },
    {
        key: "family",
        title: "Student / Parent",
        icon: Handshake,
        description: "Glance at schedules, celebrate streaks, and nudge mentors in seconds.",
        gradient: "var(--mtss-role-card-family)",
        titleGradient: "var(--mtss-role-title-family)",
        buttonGradient: "var(--mtss-role-pill-family)",
        textColor: "var(--mtss-role-ink-family)",
        badge: "Coming Soon",
    },
];
