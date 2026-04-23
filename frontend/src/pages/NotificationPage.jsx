import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    BellRing,
    Check,
    Clock4,
    ExternalLink,
    Filter,
    RefreshCw,
    Sparkles,
    Trash2,
    UserRound,
    UsersRound
} from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import EmptyState from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
    deleteNotificationById,
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "@/services/notificationService";
import socketService from "@/services/socketService";

const PRIORITY_SCORE = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
};

const CATEGORY_CONFIG = {
    support_request: { label: "Support", tone: "destructive" },
    alert: { label: "Alert", tone: "destructive" },
    reminder: { label: "Reminder", tone: "secondary" },
    achievement: { label: "Achievement", tone: "accent" },
    feedback: { label: "Feedback", tone: "default" },
    system: { label: "System", tone: "outline" }
};

const SCOPE_FILTERS = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "unread", label: "Unread" },
    { key: "high_priority", label: "High Priority" },
    { key: "needs_followup", label: "Needs Follow-up" }
];

const GROUP_OPTIONS = [
    { key: "student", label: "Group by Student" },
    { key: "class", label: "Group by Class" },
    { key: "category", label: "Group by Category" },
    { key: "priority", label: "Group by Urgency" }
];

const SNOOZE_HOURS = 2;
const SNOOZE_STORAGE_KEY = "notification_action_center_snooze";
const REFRESH_INTERVAL_MS = 120_000;

const cleanText = (value = "") =>
    String(value || "")
        .replace(/<[^>]*>/g, "")
        .replace(/https?:\/\/[^\s]+/gi, "")
        .replace(/\s+/g, " ")
        .trim();

const parseDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const toLowerText = (value = "") => String(value || "").trim().toLowerCase();

const readSnoozedMap = () => {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(SNOOZE_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== "object") return {};
        return parsed;
    } catch {
        return {};
    }
};

const saveSnoozedMap = (map = {}) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Intentionally ignored. Local storage is non-critical for notifications.
    }
};

const formatRelativeTime = (dateValue) => {
    const date = parseDate(dateValue);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
};

const toRecord = (raw = {}) => ({
    id: String(raw._id || raw.id || ""),
    title: cleanText(raw.title || "Notification"),
    message: cleanText(raw.message || ""),
    category: toLowerText(raw.category || "system") || "system",
    priority: toLowerText(raw.priority || "medium") || "medium",
    isRead: Boolean(raw.isRead),
    createdAt: parseDate(raw.createdAt),
    readAt: raw.readAt ? parseDate(raw.readAt) : null,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {}
});

const sortRecordsDesc = (records = []) =>
    [...records].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const upsertRecordById = (records = [], raw = {}) => {
    const nextRecord = toRecord(raw);
    if (!nextRecord.id) return records;

    const index = records.findIndex((item) => item.id === nextRecord.id);
    if (index < 0) {
        return sortRecordsDesc([nextRecord, ...records]);
    }

    const updated = [...records];
    updated[index] = nextRecord;
    return sortRecordsDesc(updated);
};

const removeRecordById = (records = [], notificationId = "") => {
    const targetId = String(notificationId || "").trim();
    if (!targetId) return records;
    return records.filter((item) => item.id !== targetId);
};

const getAgeHours = (record) => (Date.now() - record.createdAt.getTime()) / 3_600_000;

const getUrgencyBucket = (record) => {
    const ageHours = getAgeHours(record);
    const priorityScore = PRIORITY_SCORE[record.priority] || PRIORITY_SCORE.medium;

    if (!record.isRead && (priorityScore >= PRIORITY_SCORE.high || ageHours >= 24)) {
        return "must_do";
    }
    if (!record.isRead || ageHours >= 8) {
        return "due_soon";
    }
    return "can_wait";
};

const getGroupLabel = (record, mode = "student") => {
    const metadata = record.metadata || {};
    if (mode === "student") {
        return cleanText(metadata.studentName || metadata.student || metadata.targetName || "General Updates");
    }
    if (mode === "class") {
        return cleanText(metadata.className || metadata.class || metadata.gradeClass || "General Class");
    }
    if (mode === "category") {
        return CATEGORY_CONFIG[record.category]?.label || "General";
    }
    if (mode === "priority") {
        return `Priority: ${record.priority || "medium"}`;
    }
    return "General";
};

const resolveDefaultRoute = (role = "") =>
    toLowerText(role) === "student" ? "/student/support-hub" : "/support-hub";

const resolveActionRoute = (record, role = "") => {
    const metadata = record.metadata || {};
    const directRoute = cleanText(
        metadata.actionRoute || metadata.navigateTo || metadata.route || metadata.deepLink || ""
    );
    if (directRoute.startsWith("/")) return directRoute;

    const operation = toLowerText(metadata.operation || metadata.command || "");
    if (operation === "append_mtss_progress_checkin") return "/mtss/teacher";
    if (operation === "create_mtss_intervention") return "/mtss/teacher";
    if (operation === "assign_students_to_mtss_mentor") return "/mtss/admin";
    if (operation === "assign_intervention_mentor") return "/mtss/admin";
    if (operation === "reassign_mtss_assignment_mentor") return "/mtss/admin";
    if (operation === "update_mtss_assignment_status") return "/mtss/teacher";
    if (operation === "update_mtss_goal_completion") return "/mtss/teacher";

    if (record.category === "support_request") {
        return toLowerText(role) === "student" ? "/student/emotional-checkin" : "/emotional-checkin/dashboard";
    }
    if (record.category === "alert" || record.category === "reminder") {
        return toLowerText(role) === "student" ? "/student/support-hub" : "/mtss/teacher";
    }
    return resolveDefaultRoute(role);
};

const resolveQuickAction = (record, role = "") => {
    const operation = toLowerText(record.metadata?.operation || "");
    if (operation === "append_mtss_progress_checkin") {
        return { label: "Log Progress", route: "/mtss/teacher" };
    }
    if (operation === "assign_intervention_mentor" || operation === "reassign_mtss_assignment_mentor") {
        return { label: "Assign Mentor", route: "/mtss/admin" };
    }
    if (operation === "create_mtss_intervention") {
        return { label: "Create Intervention", route: "/mtss/teacher" };
    }
    if (toLowerText(role) === "student") {
        return { label: "Open Student", route: resolveActionRoute(record, role) };
    }
    return { label: "Open Workspace", route: resolveActionRoute(record, role) };
};

const getPriorityBadgeVariant = (priority = "medium") => {
    const normalized = toLowerText(priority);
    if (normalized === "urgent" || normalized === "high") return "destructive";
    if (normalized === "medium") return "secondary";
    return "outline";
};

const FilterChip = memo(function FilterChip({ active, onClick, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${active
                    ? "border-primary/45 bg-primary/15 text-primary shadow-sm"
                    : "border-border/55 bg-card/45 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
        >
            {label}
        </button>
    );
});

const NotificationRow = memo(function NotificationRow({
    item,
    role,
    onMarkRead,
    onDelete,
    onSnooze,
    onOpenRoute
}) {
    const categoryInfo = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.system;
    const quickAction = resolveQuickAction(item, role);
    const relativeTime = formatRelativeTime(item.createdAt);

    return (
        <article className="rounded-2xl border border-border/55 bg-card/75 p-3 shadow-sm backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-foreground">{item.title}</h4>
                        <Badge variant={categoryInfo.tone}>{categoryInfo.label}</Badge>
                        <Badge variant={getPriorityBadgeVariant(item.priority)}>
                            {String(item.priority || "medium").toUpperCase()}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message || "No additional details."}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Clock4 className="h-3.5 w-3.5" />
                            {relativeTime}
                        </span>
                        {item.metadata?.studentName ? (
                            <span className="inline-flex items-center gap-1">
                                <UserRound className="h-3.5 w-3.5" />
                                {cleanText(item.metadata.studentName)}
                            </span>
                        ) : null}
                        {item.metadata?.className ? (
                            <span className="inline-flex items-center gap-1">
                                <UsersRound className="h-3.5 w-3.5" />
                                {cleanText(item.metadata.className)}
                            </span>
                        ) : null}
                    </div>
                </div>

                {!item.isRead ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /> : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {!item.isRead ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full px-2 text-xs"
                        onClick={() => onMarkRead(item.id)}
                    >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Mark done
                    </Button>
                ) : null}

                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full px-2 text-xs"
                    onClick={() => onSnooze(item.id)}
                >
                    <Clock4 className="mr-1 h-3.5 w-3.5" />
                    Snooze
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full px-2 text-xs"
                    onClick={() => onOpenRoute(quickAction.route)}
                >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    {quickAction.label}
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(item.id)}
                >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                </Button>
            </div>
        </article>
    );
});

export default function NotificationPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const authUser = useSelector((state) => state.auth?.user);
    const userRole = toLowerText(authUser?.role || "");
    const currentUserId = useMemo(
        () => String(authUser?._id || authUser?.id || authUser?.userId || "").trim(),
        [authUser]
    );

    const [notifications, setNotifications] = useState([]);
    const [scopeFilter, setScopeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [groupBy, setGroupBy] = useState("student");
    const [showChecklist, setShowChecklist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [snoozedMap, setSnoozedMap] = useState(() => readSnoozedMap());

    const loadNotifications = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError("");
        try {
            const notificationPayload = await getNotifications({ page: 1, limit: 100 });
            const nextItems = Array.isArray(notificationPayload?.notifications)
                ? sortRecordsDesc(notificationPayload.notifications.map(toRecord).filter((item) => item.id))
                : [];
            setNotifications(nextItems);
        } catch (requestError) {
            console.error("Failed to load notifications:", requestError);
            setError("Failed to load notifications. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        const timer = setInterval(() => {
            loadNotifications({ silent: true });
        }, REFRESH_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [loadNotifications]);

    useEffect(() => {
        if (!currentUserId) return undefined;

        socketService.connect();
        socketService.joinPersonal(currentUserId);
        socketService.joinNotifications(currentUserId);

        const handleNotificationNew = (payload = {}) => {
            const rawNotification = payload?.notification || payload;
            setNotifications((current) => upsertRecordById(current, rawNotification));
        };

        const handleNotificationUpdated = (payload = {}) => {
            const rawNotification = payload?.notification || payload;
            setNotifications((current) => upsertRecordById(current, rawNotification));
        };

        const handleNotificationDeleted = (payload = {}) => {
            const deletedId =
                payload?.notificationId ||
                payload?.notification?._id ||
                payload?.notification?.id ||
                payload?._id ||
                payload?.id;
            setNotifications((current) => removeRecordById(current, deletedId));
        };

        const handleNotificationBulkRead = (payload = {}) => {
            const ids = Array.isArray(payload?.notificationIds)
                ? payload.notificationIds.map((entry) => String(entry || "").trim()).filter(Boolean)
                : [];
            if (ids.length === 0) return;

            const idSet = new Set(ids);
            const readAt = new Date();
            setNotifications((current) =>
                current.map((item) => (idSet.has(item.id) ? { ...item, isRead: true, readAt } : item))
            );
        };

        socketService.onNotificationNew(handleNotificationNew);
        socketService.onNotificationUpdated(handleNotificationUpdated);
        socketService.onNotificationDeleted(handleNotificationDeleted);
        socketService.onNotificationBulkRead(handleNotificationBulkRead);

        return () => {
            socketService.offNotificationNew(handleNotificationNew);
            socketService.offNotificationUpdated(handleNotificationUpdated);
            socketService.offNotificationDeleted(handleNotificationDeleted);
            socketService.offNotificationBulkRead(handleNotificationBulkRead);
            socketService.leaveNotifications(currentUserId);
            socketService.leavePersonal(currentUserId);
        };
    }, [currentUserId]);

    useEffect(() => {
        saveSnoozedMap(snoozedMap);
    }, [snoozedMap]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadNotifications({ silent: true });
    }, [loadNotifications]);

    const handleMarkRead = useCallback(
        async (notificationId) => {
            try {
                await markNotificationAsRead(notificationId);
                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notificationId ? { ...item, isRead: true, readAt: new Date() } : item
                    )
                );
            } catch {
                toast({
                    title: "Failed",
                    description: "Unable to mark notification as read.",
                    variant: "destructive"
                });
            }
        },
        [toast]
    );

    const handleMarkAllRead = useCallback(async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: new Date() })));
            toast({
                title: "All done",
                description: "All notifications are marked as read."
            });
        } catch {
            toast({
                title: "Failed",
                description: "Unable to mark all notifications as read.",
                variant: "destructive"
            });
        }
    }, [toast]);

    const handleDelete = useCallback(
        async (notificationId) => {
            try {
                await deleteNotificationById(notificationId);
                setNotifications((current) => current.filter((item) => item.id !== notificationId));
            } catch {
                toast({
                    title: "Failed",
                    description: "Unable to remove this notification.",
                    variant: "destructive"
                });
            }
        },
        [toast]
    );

    const handleSnooze = useCallback(
        (notificationId) => {
            const until = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
            setSnoozedMap((current) => ({ ...current, [notificationId]: until }));
            toast({
                title: "Snoozed",
                description: `Reminder hidden for ${SNOOZE_HOURS} hours.`
            });
        },
        [toast]
    );

    const activeRecords = useMemo(() => {
        const now = Date.now();
        return notifications.filter((item) => {
            const snoozeUntil = Number(snoozedMap[item.id] || 0);
            return !Number.isFinite(snoozeUntil) || snoozeUntil <= now;
        });
    }, [notifications, snoozedMap]);

    const categoryOptions = useMemo(() => {
        const values = new Set(["all"]);
        activeRecords.forEach((item) => values.add(item.category || "system"));
        return Array.from(values);
    }, [activeRecords]);

    const priorityOptions = useMemo(() => {
        const values = new Set(["all"]);
        activeRecords.forEach((item) => values.add(item.priority || "medium"));
        return Array.from(values);
    }, [activeRecords]);

    const filteredRecords = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return activeRecords.filter((item) => {
            if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
            if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
            if (scopeFilter === "unread" && item.isRead) return false;
            if (scopeFilter === "high_priority" && !["high", "urgent"].includes(item.priority)) return false;
            if (scopeFilter === "today" && item.createdAt.getTime() < startOfDay) return false;
            if (scopeFilter === "needs_followup" && (item.isRead || getAgeHours(item) < 24)) return false;
            return true;
        });
    }, [activeRecords, categoryFilter, priorityFilter, scopeFilter]);

    const summaryStats = useMemo(() => {
        const unread = activeRecords.filter((item) => !item.isRead).length;
        const mustDo = filteredRecords.filter((item) => getUrgencyBucket(item) === "must_do").length;
        const overdue = filteredRecords.filter((item) => !item.isRead && getAgeHours(item) > 24).length;

        return {
            total: activeRecords.length,
            unread,
            mustDo,
            overdue
        };
    }, [activeRecords, filteredRecords]);

    const sections = useMemo(() => {
        const sectionSeed = [
            {
                key: "must_do",
                title: "Must Do Today",
                subtitle: "High impact actions and overdue follow-ups",
                toneClass: "border-rose-300/35 bg-rose-400/10"
            },
            {
                key: "due_soon",
                title: "Due Soon",
                subtitle: "Needs attention before it becomes urgent",
                toneClass: "border-amber-300/35 bg-amber-400/10"
            },
            {
                key: "can_wait",
                title: "Can Wait",
                subtitle: "Informational items and lower urgency updates",
                toneClass: "border-sky-300/35 bg-sky-400/10"
            }
        ];

        return sectionSeed
            .map((section) => {
                const items = filteredRecords.filter((item) => getUrgencyBucket(item) === section.key);
                const grouped = new Map();
                items.forEach((item) => {
                    const key = getGroupLabel(item, groupBy);
                    if (!grouped.has(key)) {
                        grouped.set(key, { label: key, items: [] });
                    }
                    grouped.get(key).items.push(item);
                });

                const groups = Array.from(grouped.values())
                    .map((group) => ({
                        ...group,
                        items: group.items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    }))
                    .sort((a, b) => b.items.length - a.items.length);

                return {
                    ...section,
                    groups
                };
            })
            .filter((section) => section.groups.length > 0);
    }, [filteredRecords, groupBy]);

    const aiMiniSummary = useMemo(() => {
        const scored = [...filteredRecords]
            .sort((a, b) => {
                const scoreA = (PRIORITY_SCORE[a.priority] || 1) * 100 + (a.isRead ? 0 : 50) + Math.round(getAgeHours(a));
                const scoreB = (PRIORITY_SCORE[b.priority] || 1) * 100 + (b.isRead ? 0 : 50) + Math.round(getAgeHours(b));
                return scoreB - scoreA;
            })
            .slice(0, 3);

        const actions = scored.map((item) => {
            const studentName = cleanText(item.metadata?.studentName || item.metadata?.targetName || "");
            const prefix = studentName ? `${studentName}: ` : "";
            return `${prefix}${item.title}`;
        });

        const checklist = scored.map((item, index) => {
            const quickAction = resolveQuickAction(item, userRole);
            return `${index + 1}. ${quickAction.label} - ${item.title}`;
        });

        return {
            actions,
            checklist
        };
    }, [filteredRecords, userRole]);

    const timelineRows = useMemo(
        () =>
            [...filteredRecords]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 8)
                .map((item) => ({
                    id: item.id,
                    actor: cleanText(item.metadata?.actorName || item.metadata?.updatedByName || "System"),
                    action: item.title,
                    time: formatRelativeTime(item.createdAt),
                    route: resolveActionRoute(item, userRole)
                })),
        [filteredRecords, userRole]
    );

    return (
        <AnimatedPage>
            <Helmet>
                <title>Notification Action Center - MWS IntegraLearn</title>
            </Helmet>

            <main className="mx-auto w-full max-w-6xl px-3 pb-16 pt-4 sm:px-4 sm:pt-6">
                <header className="rounded-3xl border border-primary/25 bg-gradient-to-br from-cyan-400/15 via-primary/10 to-fuchsia-400/15 p-4 shadow-sm backdrop-blur-xl sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <Link to={-1} aria-label="Back">
                                <Button variant="ghost" size="icon" className="rounded-full border border-border/50 bg-card/40">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    Notification Action Center
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Scan. Prioritize. Execute. One screen for your daily workflow.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-full" onClick={handleMarkAllRead}>
                                <Check className="mr-1 h-4 w-4" />
                                Mark all
                            </Button>
                            {/* <Link to="/notifications/settings">
                                <Button variant="outline" size="sm" className="rounded-full">
                                    <Settings className="mr-1 h-4 w-4" />
                                    Settings
                                </Button>
                            </Link> */}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <Card className="border-primary/20 bg-card/70">
                            <CardContent className="p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Stream</p>
                                <p className="mt-1 text-xl font-semibold">{summaryStats.total}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-cyan-400/35 bg-cyan-400/10">
                            <CardContent className="p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Unread</p>
                                <p className="mt-1 text-xl font-semibold">{summaryStats.unread}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-rose-300/35 bg-rose-400/10">
                            <CardContent className="p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Must Do</p>
                                <p className="mt-1 text-xl font-semibold">{summaryStats.mustDo}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-amber-300/35 bg-amber-400/10">
                            <CardContent className="p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">SLA &gt; 24h</p>
                                <p className="mt-1 text-xl font-semibold">{summaryStats.overdue}</p>
                            </CardContent>
                        </Card>
                    </div>
                </header>

                <section className="mt-4 grid gap-3 lg:grid-cols-3">
                    <Card className="border-primary/20 bg-card/80 lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Filter className="h-4 w-4 text-primary" />
                                Smart Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <div className="flex flex-wrap gap-2">
                                {SCOPE_FILTERS.map((item) => (
                                    <FilterChip
                                        key={item.key}
                                        active={scopeFilter === item.key}
                                        label={item.label}
                                        onClick={() => setScopeFilter(item.key)}
                                    />
                                ))}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <label className="text-xs text-muted-foreground">
                                    Category
                                    <select
                                        className="mt-1 w-full rounded-xl border border-border/50 bg-background/80 px-2 py-1.5 text-sm text-foreground"
                                        value={categoryFilter}
                                        onChange={(event) => setCategoryFilter(event.target.value)}
                                    >
                                        {categoryOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option === "all" ? "All categories" : option}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs text-muted-foreground">
                                    Priority
                                    <select
                                        className="mt-1 w-full rounded-xl border border-border/50 bg-background/80 px-2 py-1.5 text-sm text-foreground"
                                        value={priorityFilter}
                                        onChange={(event) => setPriorityFilter(event.target.value)}
                                    >
                                        {priorityOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option === "all" ? "All priorities" : option}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs text-muted-foreground">
                                    Grouping
                                    <select
                                        className="mt-1 w-full rounded-xl border border-border/50 bg-background/80 px-2 py-1.5 text-sm text-foreground"
                                        value={groupBy}
                                        onChange={(event) => setGroupBy(event.target.value)}
                                    >
                                        {GROUP_OPTIONS.map((option) => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-400/10 via-cyan-400/10 to-primary/15">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-fuchsia-500" />
                                AI Mini Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0 text-sm">
                            {aiMiniSummary.actions.length > 0 ? (
                                aiMiniSummary.actions.map((action) => (
                                    <p key={action} className="rounded-xl border border-border/40 bg-card/70 px-3 py-2">
                                        {action}
                                    </p>
                                ))
                            ) : (
                                <p className="rounded-xl border border-border/40 bg-card/70 px-3 py-2 text-muted-foreground">
                                    No urgent items. You are on track today.
                                </p>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-1 w-full rounded-full"
                                onClick={() => setShowChecklist((current) => !current)}
                            >
                                {showChecklist ? "Hide" : "Show"} 20-minute checklist
                            </Button>

                            {showChecklist ? (
                                <ol className="space-y-1 rounded-xl border border-border/40 bg-card/70 px-3 py-2 text-xs">
                                    {aiMiniSummary.checklist.length > 0 ? (
                                        aiMiniSummary.checklist.map((item) => <li key={item}>{item}</li>)
                                    ) : (
                                        <li>No checklist generated yet.</li>
                                    )}
                                </ol>
                            ) : null}
                        </CardContent>
                    </Card>
                </section>

                {error ? (
                    <Card className="mt-4 border-destructive/35 bg-destructive/10">
                        <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
                    </Card>
                ) : null}

                {loading ? (
                    <Card className="mt-4 border-border/50 bg-card/80">
                        <CardContent className="p-5 text-sm text-muted-foreground">Loading notification stream...</CardContent>
                    </Card>
                ) : null}

                {!loading && filteredRecords.length === 0 ? (
                    <div className="mt-6">
                        <EmptyState
                            icon={<BellRing className="h-6 w-6" />}
                            title="Action Center is clear"
                            subtitle="No notifications match your current filters."
                            action={
                                <Button
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => {
                                        setScopeFilter("all");
                                        setCategoryFilter("all");
                                        setPriorityFilter("all");
                                    }}
                                >
                                    Reset filters
                                </Button>
                            }
                        />
                    </div>
                ) : null}

                {!loading && filteredRecords.length > 0 ? (
                    <section className="mt-5 space-y-4">
                        {sections.map((section) => (
                            <Card key={section.key} className={`border ${section.toneClass}`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{section.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-0">
                                    {section.groups.map((group) => (
                                        <div key={`${section.key}-${group.label}`} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                                                <Badge variant="outline">{group.items.length} item(s)</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {group.items.map((item) => (
                                                    <NotificationRow
                                                        key={item.id}
                                                        item={item}
                                                        role={userRole}
                                                        onMarkRead={handleMarkRead}
                                                        onDelete={handleDelete}
                                                        onSnooze={handleSnooze}
                                                        onOpenRoute={(route) => navigate(route)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                ) : null}

                {!loading && timelineRows.length > 0 ? (
                    <Card className="mt-5 border-border/55 bg-card/85">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Timeline Audit</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Who did what and when, for accountability and follow-up.
                            </p>
                        </CardHeader>
                        <CardContent className="overflow-x-auto pt-0">
                            <table className="w-full min-w-[520px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="py-2 pr-3 font-medium">Actor</th>
                                        <th className="py-2 pr-3 font-medium">Action</th>
                                        <th className="py-2 pr-3 font-medium">Time</th>
                                        <th className="py-2 font-medium">Open</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timelineRows.map((row) => (
                                        <tr key={row.id} className="border-b border-border/35">
                                            <td className="py-2 pr-3">{row.actor}</td>
                                            <td className="py-2 pr-3">{row.action}</td>
                                            <td className="py-2 pr-3 text-muted-foreground">{row.time}</td>
                                            <td className="py-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 rounded-full px-2 text-xs"
                                                    onClick={() => navigate(row.route)}
                                                >
                                                    Open
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="mt-5 border-primary/25 bg-primary/10">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                        <p className="text-muted-foreground">
                            Friendly reminder: finish one <span className="font-semibold text-foreground">Must Do</span> item now,
                            then move to Due Soon. Keep the queue short and focused.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => navigate(resolveDefaultRoute(userRole))}
                        >
                            Open workspace
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </AnimatedPage>
    );
}
