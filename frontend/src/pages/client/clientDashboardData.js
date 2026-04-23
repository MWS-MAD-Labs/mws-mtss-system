import { Plus, Clock, MessageSquare } from "lucide-react";

export const quickActions = [
    { title: "Post", icon: Plus, path: "/post-job" },
    { title: "History", icon: Clock, path: "/history" },
    { title: "Chat", icon: MessageSquare, path: "/chat" },
];

export const activeJobs = [
    { id: 1, title: "Garden Cleaning", worker: "Budi S.", status: "In Progress", progress: 60 },
    { id: 2, title: "Logo Design", worker: "Citra L.", status: "Review", progress: 100 },
];
