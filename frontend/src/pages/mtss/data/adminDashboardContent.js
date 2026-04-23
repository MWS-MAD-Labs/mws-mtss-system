import { LayoutDashboard, Users2, UserCheck, LineChart as LineChartIcon, Building2, Sparkles, Shield, Activity, Star } from "lucide-react";

export const adminTabs = [
    { key: "overview", label: "System Overview", icon: LayoutDashboard },
    { key: "students", label: "All Students", icon: Users2 },
    { key: "mentors", label: "Manage Mentors", icon: UserCheck },
    { key: "analytics", label: "Analytics Lab", icon: LineChartIcon },
];

export const heroCard = {
    badgeIcon: Building2,
    badgeLabel: "Admin / Principal",
    badgeCaption: "",
    heading: "",
    subheading: "",
};

export const overviewIcons = {
    tier: Sparkles,
    interventions: Shield,
    activity: Activity,
    mentor: Users2,
    stats: Star,
};
