import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BellRing, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";
import { loadAssistantProfile } from "@/store/slices/aiChatSlice";
import { useToast } from "@/components/ui/use-toast";
import {
    detectAssistantNavigationIntent,
    detectAssistantThemeIntent,
    sanitizeAssistantNavigateAction
} from "@/utils/studentAssistantNavigator";
import * as aiChatService from "@/services/aiChatService";
import { normalizeAssistantAction, normalizeAssistantWidgets } from "@/features/assistant/runtime/responseValidator";
import {
    buildDockCommandPack,
    buildLiveDockInsightReply,
    buildUtilityDockContextPayload,
    composeDockContextMessage,
    detectDockLiveInsightIntent
} from "@/utils/utilityDockContext";
import {
    canExecuteAutomationRole,
    buildOperationPayloadFromForm,
    detectDockOperationIntent,
    getDockOperationFormConfig,
    getOperationLabel,
    isOperationAllowedForRole,
    normalizeRoleName
} from "@/utils/utilityDockAutomation";
import { applyThemePreference, emitThemeSpell, getStoredTheme, persistTheme } from "@/lib/theme";
import UtilityDockWidgetPreview from "@/components/app/dock/UtilityDockWidgetPreview";
import MarkdownRenderer from "@/features/assistant/chat/widgets/MarkdownRenderer";

const NUDGE_STORAGE_KEY = "ai_dock_nudge_v2";
const NUDGE_DAILY_LIMIT = 3;
const NUDGE_COOLDOWN_MS = 25 * 60 * 1000;
const NUDGE_INITIAL_DELAY_MS = 15000;
const NUDGE_SNOOZE_MS = 2 * 60 * 60 * 1000;
const THEME_COMMAND_TYPING_DELAY_MS = 280;
const THEME_COMMAND_APPLY_DELAY_MS = 320;
const DOCK_MESSAGE_LIMIT = 18;
const DOCK_WIDGET_LIMIT = 2;
const DOCK_ACTION_LIMIT = 4;
const DOCK_API_MESSAGE_MAX_LENGTH = 2000;
const COMPACT_DOCK_BREAKPOINT = 768;

const safeList = (value) => (Array.isArray(value) ? value : []);
const safeText = (value, max = 220) =>
    String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

const getIsCompactViewport = () =>
    typeof window !== "undefined" && window.innerWidth < COMPACT_DOCK_BREAKPOINT;

const preprocessDockMarkdown = (content = "") =>
    String(content || "")
        .replace(/&lt;br\s*\/?&gt;/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\+\+([^\n+][\s\S]*?)\+\+/g, "<u>$1</u>");

const isLengthLimitError = (value = "") => /message too long/i.test(String(value || ""));
const QUERY_LIKE_DOCK_PROMPT_REGEX = /(\?|^who\b|^what\b|^which\b|^how\b|^why\b|^when\b|^where\b|\bsiapa\b|\bberapa\b|\bmana\b|\blist\b|\btier\s*[123]\b)/i;

const describeOperation = (operation = "") =>
    safeText(String(operation || "").replace(/_/g, " "), 72) || "automation";

const getActionLabel = (action = {}) => {
    const type = String(action?.type || "").toLowerCase();
    if (type === "navigate") {
        return safeText(action?.label || `Open ${action?.navigateTo || "page"}`, 78) || "Open";
    }
    if (type === "prefill") return "Use suggestion";
    if (type === "execute_operation") {
        return safeText(action?.label || `Run ${describeOperation(action?.operation)}`, 78) || "Run automation";
    }
    return "Run action";
};

const trimDockWidgets = (widgets = []) =>
    normalizeAssistantWidgets(widgets)
        .slice(0, DOCK_WIDGET_LIMIT)
        .map((widget = {}) => {
            const type = String(widget.type || "").toLowerCase();
            if (type === "table") {
                return {
                    ...widget,
                    columns: safeList(widget.columns).slice(0, 4),
                    rows: safeList(widget.rows).slice(0, 4)
                };
            }
            if (type === "checklist") {
                return {
                    ...widget,
                    items: safeList(widget.items).slice(0, 6)
                };
            }
            if (type === "action_chips") {
                return {
                    ...widget,
                    actions: safeList(widget.actions).slice(0, 5)
                };
            }
            if (type === "skill_cards") {
                return {
                    ...widget,
                    cards: safeList(widget.cards).slice(0, 4)
                };
            }
            if (type === "stats") {
                return {
                    ...widget,
                    items: safeList(widget.items).slice(0, 3)
                };
            }
            if (type === "bar_chart") {
                return {
                    ...widget,
                    data: safeList(widget.data).slice(0, 5)
                };
            }
            return widget;
        });

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const readNudgeState = () => {
    if (typeof window === "undefined") {
        return { day: getTodayKey(), count: 0, lastAt: 0, lastPath: "", snoozeUntil: 0 };
    }

    try {
        const raw = window.localStorage.getItem(NUDGE_STORAGE_KEY);
        if (!raw) return { day: getTodayKey(), count: 0, lastAt: 0, lastPath: "", snoozeUntil: 0 };
        const parsed = JSON.parse(raw);
        return {
            day: String(parsed?.day || getTodayKey()),
            count: Number(parsed?.count || 0),
            lastAt: Number(parsed?.lastAt || 0),
            lastPath: String(parsed?.lastPath || ""),
            snoozeUntil: Number(parsed?.snoozeUntil || 0)
        };
    } catch {
        return { day: getTodayKey(), count: 0, lastAt: 0, lastPath: "", snoozeUntil: 0 };
    }
};

const writeNudgeState = (nextState) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
        // no-op
    }
};

const normalizeNudgeState = (state) => {
    const today = getTodayKey();
    if (String(state?.day || "") === today) {
        return {
            day: today,
            count: Number(state?.count || 0),
            lastAt: Number(state?.lastAt || 0),
            lastPath: String(state?.lastPath || ""),
            snoozeUntil: Number(state?.snoozeUntil || 0)
        };
    }

    return {
        day: today,
        count: 0,
        lastAt: 0,
        lastPath: "",
        snoozeUntil: Number(state?.snoozeUntil || 0)
    };
};

const getTimeGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return "Good morning";
    if (hours < 16) return "Good afternoon";
    return "Good evening";
};

const normalizeRole = (role = "") => String(role || "").trim().toLowerCase();
const isStudentRole = (role = "") => normalizeRole(role) === "student";
const getAssistantChatPath = (role = "") => (isStudentRole(role) ? "/student/ai-chat" : "/ai-assistant");
const getCurrentTheme = () => {
    if (typeof document !== "undefined") {
        return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return getStoredTheme();
};

const buildDockThemeReply = ({
    assistantName = "Jarvis",
    studentCallName = "there",
    isStudent = false,
    targetTheme = "light",
    isAlreadyActive = false,
    incantation = "Lumos Maxima"
} = {}) => {
    const who = isStudent ? `${studentCallName}, ` : "";
    if (targetTheme === "dark") {
        if (isAlreadyActive) {
            return `${assistantName}: Dark mode is already active. Recasting anyway. ${incantation}.`;
        }
        return `${assistantName}: ${who}switching to dark mode now. ${incantation}.`;
    }

    if (isAlreadyActive) {
        return `${assistantName}: Light mode is already active. Recasting anyway. ${incantation}.`;
    }
    return `${assistantName}: ${who}switching to light mode now. ${incantation}.`;
};

const pickAdaptiveNudge = ({
    pathname = "",
    role = "student",
    assistantName = "Jarvis",
    studentCallName = "there",
    focusItems = [],
    quickActions = []
} = {}) => {
    const greeting = getTimeGreeting();
    const primaryFocus = String(focusItems?.[0] || "").trim();
    const primaryQuickAction = String(quickActions?.[0] || "").trim();

    if (isStudentRole(role) && pathname.startsWith("/student/emotional-checkin")) {
        return {
            title: `${assistantName} is here`,
            text: `${greeting}, ${studentCallName}. Want a quick emotional reset before continuing your day?`,
            primaryAction: {
                label: "Guide me now",
                type: "chat",
                message: "Guide me through a quick emotional check-in and suggest my best next step today."
            },
            secondaryAction: {
                label: "Open manual check-in",
                type: "navigate",
                navigateTo: "/student/emotional-checkin/manual"
            }
        };
    }

    if (isStudentRole(role) && pathname.startsWith("/student/support-hub")) {
        return {
            title: `${assistantName} quick nudge`,
            text: primaryFocus
                ? `Your focus right now: ${primaryFocus}. Want me to break it into simple action steps?`
                : `${greeting}, ${studentCallName}. I can help you pick the best next action in under 1 minute.`,
            primaryAction: {
                label: "Build my next steps",
                type: "chat",
                message: "Help me choose my next best action from support hub context and make it actionable."
            },
            secondaryAction: {
                label: "Open AI chat",
                type: "navigate",
                navigateTo: getAssistantChatPath(role)
            }
        };
    }

    if (!isStudentRole(role) && pathname.startsWith("/support-hub")) {
        return {
            title: `${assistantName} quick nudge`,
            text: primaryFocus
                ? `Top focus detected: ${primaryFocus}. Want me to turn it into 3 concrete actions?`
                : `${greeting}, ${studentCallName}. I can help prioritize your next best action in under 1 minute.`,
            primaryAction: {
                label: "Prioritize now",
                type: "chat",
                message: "Help me prioritize my top work actions right now with one first step."
            },
            secondaryAction: {
                label: "Open AI assistant",
                type: "navigate",
                navigateTo: getAssistantChatPath(role)
            }
        };
    }

    if (primaryQuickAction) {
        return {
            title: `${assistantName} check-in`,
            text: `${greeting}, ${studentCallName}. Want to continue with: "${primaryQuickAction}"?`,
            primaryAction: {
                label: "Yes, let's do it",
                type: "chat",
                message: primaryQuickAction
            },
            secondaryAction: {
                label: "Open AI chat",
                type: "navigate",
                navigateTo: getAssistantChatPath(role)
            }
        };
    }

    return {
        title: `${assistantName} check-in`,
        text: `${greeting}, ${studentCallName}. I can help you plan your day in 3 simple steps whenever you're ready.`,
        primaryAction: {
            label: "Plan my day",
            type: "chat",
            message: isStudentRole(role)
                ? "Help me make a practical study plan for today with clear time blocks."
                : "Help me make a practical work plan for today with clear priorities and time blocks."
        },
        secondaryAction: {
            label: "Open AI assistant",
            type: "navigate",
            navigateTo: getAssistantChatPath(role)
        }
    };
};

const getQuickActions = (role = "student") => {
    if (isStudentRole(role)) {
        return [
            {
                label: "Support Hub",
                description: "Go to your student home hub",
                navigateTo: "/student/support-hub"
            },
            {
                label: "Open AI Chat",
                description: "Continue your personal conversation",
                navigateTo: "/student/ai-chat"
            },
            {
                label: "My Profile",
                description: "Open profile, stats, and journey",
                navigateTo: "/profile"
            },
            {
                label: "Manual Check-in",
                description: "Write your emotion check-in manually",
                navigateTo: "/student/emotional-checkin/manual"
            },
            {
                label: "AI Check-in",
                description: "Use AI emotional reflection",
                navigateTo: "/student/emotional-checkin/ai"
            }
        ];
    }

    return [
        {
            label: "Support Hub",
            description: "Open your staff/teacher support workspace",
            navigateTo: "/support-hub"
        },
        {
            label: "Open AI Assistant",
            description: "Continue your personal assistant conversation",
            navigateTo: "/ai-assistant"
        },
        {
            label: "My Profile",
            description: "Open profile, stats, and journey",
            navigateTo: "/profile"
        },
        {
            label: "Staff Check-in",
            description: "Log a quick emotional check-in",
            navigateTo: "/emotional-checkin/staff"
        },
    ];
};

const normalizeDockActionEntries = (entries = []) =>
    safeList(entries)
        .map((entry = {}) => {
            const rawAction = entry?.action || entry;
            const action = normalizeAssistantAction(rawAction);
            if (!action) return null;
            return {
                label: safeText(entry?.label || getActionLabel(action), 90) || getActionLabel(action),
                action
            };
        })
        .filter(Boolean)
        .slice(0, DOCK_ACTION_LIMIT);

const buildResponseActionEntries = (payload = {}) => {
    const entries = [];
    const clientAction = normalizeAssistantAction(payload?.clientAction || {});
    if (clientAction) {
        entries.push({
            label: getActionLabel(clientAction),
            action: clientAction
        });
    }
    return normalizeDockActionEntries(entries);
};

const DOCK_POS_KEY = "ai_dock_position_v1";

const readDockPosition = () => {
    try {
        const raw = window.localStorage?.getItem(DOCK_POS_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (typeof p?.x === "number" && typeof p?.y === "number") return p;
    } catch { /* ignore */ }
    return null;
};

const writeDockPosition = (pos) => {
    try { window.localStorage?.setItem(DOCK_POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
};

const UtilityDock = memo(() => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const lowMotion = usePreferLowMotion();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [quickMessage, setQuickMessage] = useState("");
    const [dockMessages, setDockMessages] = useState([]);
    const [dockSessionId, setDockSessionId] = useState(null);
    const [isDockSending, setIsDockSending] = useState(false);
    const [dockOperationForm, setDockOperationForm] = useState(null);
    const [dockOperationValues, setDockOperationValues] = useState({});
    const [dockOperationError, setDockOperationError] = useState("");
    const [activeNudge, setActiveNudge] = useState(null);
    const [isNudgeVisible, setIsNudgeVisible] = useState(false);
    const [isCompactViewport, setIsCompactViewport] = useState(() => getIsCompactViewport());
    const hasLoadedProfileRef = useRef(false);
    const quickSendButtonRef = useRef(null);
    const quickInputRef = useRef(null);
    const dockViewportRef = useRef(null);
    const commandTimeoutsRef = useRef([]);
    const dockMessageIndexRef = useRef(0);

    /* ─── draggable dock position ─── */
    const [dockPos, setDockPos] = useState(() => readDockPosition());
    const dragRef = useRef(null);
    const dragStartRef = useRef(null);
    const wasDragRef = useRef(false);

    const handleDragStart = useCallback((e) => {
        if (isCompactViewport || e?.type === "touchstart") return;
        const touch = e.touches ? e.touches[0] : e;
        dragStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            startX: dockPos?.x ?? null,
            startY: dockPos?.y ?? null,
            moved: false,
        };
        wasDragRef.current = false;
    }, [dockPos, isCompactViewport]);

    const handleDragMove = useCallback((e) => {
        if (!dragStartRef.current) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - dragStartRef.current.x;
        const dy = touch.clientY - dragStartRef.current.y;
        if (!dragStartRef.current.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
        dragStartRef.current.moved = true;
        wasDragRef.current = true;
        e.preventDefault();

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseRight = 20;
        const baseBottom = 64;
        let newX = (dragStartRef.current.startX ?? 0) + dx;
        let newY = (dragStartRef.current.startY ?? 0) + dy;
        const minX = -(vw - baseRight - 70);
        const maxX = baseRight;
        const minY = -(vh - baseBottom - 70);
        const maxY = baseBottom;
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
        setDockPos({ x: newX, y: newY });
    }, []);

    const handleDragEnd = useCallback(() => {
        if (dragStartRef.current?.moved) {
            writeDockPosition(dockPos);
        }
        dragStartRef.current = null;
    }, [dockPos]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const handleResize = () => {
            setIsCompactViewport(getIsCompactViewport());
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!isCompactViewport) return;
        dragStartRef.current = null;
        wasDragRef.current = false;
    }, [isCompactViewport]);

    useEffect(() => {
        const onMove = (e) => handleDragMove(e);
        const onEnd = () => handleDragEnd();
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    const { user, isAuthenticated } = useSelector((state) => state.auth || {});
    const assistantProfile = useSelector((state) => state.aiChat?.assistantProfile);
    const checkinHistory = useSelector((state) => state.checkin?.checkinHistory);
    const assistantName =
        assistantProfile?.assistant?.assistantName || "Jarvis";
    const focusItems = useMemo(
        () => assistantProfile?.assistant?.daily?.focusItems || [],
        [assistantProfile?.assistant?.daily?.focusItems]
    );
    const quickActions = useMemo(
        () => assistantProfile?.assistant?.daily?.quickActions || [],
        [assistantProfile?.assistant?.daily?.quickActions]
    );

    const normalizedRole = normalizeRole(user?.role);
    const normalizedAutomationRole = normalizeRoleName(normalizedRole);
    const canRunAutomation = canExecuteAutomationRole(normalizedAutomationRole);
    const assistantChatPath = getAssistantChatPath(normalizedRole);
    const isStudent = isStudentRole(normalizedRole);
    const quickActionItems = useMemo(
        () => getQuickActions(normalizedRole),
        [normalizedRole]
    );
    const studentCallName = useMemo(() => {
        const nickname = String(user?.nickname || "").trim();
        if (nickname) return nickname;
        const name = String(user?.name || "").trim();
        if (!name) return "there";
        return name.split(/\s+/)[0] || "there";
    }, [user?.name, user?.nickname]);

    const buttonLabel = useMemo(
        () => `${assistantName} Assistant`,
        [assistantName]
    );

    const appendDockMessage = useCallback((role, content, options = {}) => {
        const text = String(content || "").trim();
        const widgets = trimDockWidgets(options.widgets || []);
        const actions = normalizeDockActionEntries(options.actions || []);
        if (!text && widgets.length === 0 && actions.length === 0) return;
        const id = `dock-${Date.now()}-${dockMessageIndexRef.current}`;
        dockMessageIndexRef.current += 1;
        const message = {
            id,
            role: role === "user" ? "user" : "assistant",
            content: text,
            createdAt: Date.now(),
            skipHistory: Boolean(options.skipHistory),
            widgets,
            actions
        };
        setDockMessages((prev) => {
            const next = [...prev, message];
            return next.slice(-DOCK_MESSAGE_LIMIT);
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const viewport = dockViewportRef.current;
        if (!viewport) return;
        viewport.scrollTop = viewport.scrollHeight;
    }, [dockMessages, isDockSending, isOpen]);

    useEffect(() => {
        setIsOpen(false);
        setIsNudgeVisible(false);
        setDockOperationForm(null);
        setDockOperationValues({});
        setDockOperationError("");
    }, [location.pathname]);

    const clearCommandTimeouts = useCallback(() => {
        commandTimeoutsRef.current.forEach((timerId) => window.clearTimeout(timerId));
        commandTimeoutsRef.current = [];
    }, []);

    const queueCommandTimeout = useCallback((callback, delayMs) => {
        const timerId = window.setTimeout(() => {
            commandTimeoutsRef.current = commandTimeoutsRef.current.filter((id) => id !== timerId);
            callback();
        }, delayMs);
        commandTimeoutsRef.current.push(timerId);
        return timerId;
    }, []);

    const getDockSpellOrigin = useCallback(() => {
        const buttonEl = quickSendButtonRef.current;
        if (buttonEl && typeof buttonEl.getBoundingClientRect === "function") {
            const rect = buttonEl.getBoundingClientRect();
            return {
                x: rect.left + (rect.width / 2),
                y: rect.top + (rect.height / 2)
            };
        }

        if (typeof window !== "undefined") {
            return {
                x: window.innerWidth * 0.88,
                y: window.innerHeight * 0.88
            };
        }

        return { x: null, y: null };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            hasLoadedProfileRef.current = false;
            return;
        }
        if (hasLoadedProfileRef.current) return;
        hasLoadedProfileRef.current = true;
        dispatch(loadAssistantProfile()).catch(() => {
            // keep silent; dock still works with fallback prompts
        });
    }, [dispatch, isAuthenticated]);

    useEffect(() => () => {
        clearCommandTimeouts();
    }, [clearCommandTimeouts]);

    const handleQuickAction = useCallback((path) => {
        if (!path) return;
        setIsOpen(false);
        setIsNudgeVisible(false);
        navigate(path);
    }, [navigate]);

    const handleDockOperationFieldChange = useCallback((key, value) => {
        if (!key) return;
        setDockOperationValues((prev) => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const cancelDockOperationForm = useCallback(() => {
        setDockOperationError("");
        setDockOperationForm(null);
        setDockOperationValues({});
    }, []);

    const prepareDockExecuteOperation = useCallback((action = {}) => {
        const operation = String(action?.operation || "").trim().toLowerCase();
        if (!operation) return false;

        if (!canRunAutomation || !isOperationAllowedForRole(normalizedAutomationRole, operation)) {
                appendDockMessage(
                    "assistant",
                    `${assistantName}: Operation "${describeOperation(operation)}" is only available for allowed MTSS roles.`
                );
            return true;
        }

        const formConfig = getDockOperationFormConfig(operation, action.payload || {});
        if (!formConfig) {
            appendDockMessage("assistant", `${assistantName}: A form for this operation is not available yet.`);
            return true;
        }

        setDockOperationError("");
        setDockOperationForm({
            ...action,
            operation,
            label: formConfig.label || getOperationLabel(operation),
            description: formConfig.description || "Complete quick form below, then run operation.",
            fields: Array.isArray(formConfig.fields) ? formConfig.fields : []
        });
        setDockOperationValues(formConfig.initialValues || {});
        setIsOpen(true);
        setIsNudgeVisible(false);
        appendDockMessage(
            "assistant",
            `${assistantName}: Ready. Fill the mini form below to run ${formConfig.label || getOperationLabel(operation)}.`
        );
        return true;
    }, [
        appendDockMessage,
        assistantName,
        canRunAutomation,
        normalizedAutomationRole
    ]);

    const submitDockOperationForm = useCallback(async (event) => {
        event?.preventDefault?.();
        if (!dockOperationForm || isDockSending) return;

        const operation = String(dockOperationForm.operation || "").trim().toLowerCase();
        if (!operation) return;

        if (dockOperationForm.requireConfirmation !== false) {
            const confirmed = window.confirm(String(dockOperationForm.confirmText || `Run "${getOperationLabel(operation)}" now?`));
            if (!confirmed) {
                appendDockMessage("assistant", `${assistantName}: Okay, I canceled the operation for now.`);
                return;
            }
        }

        const { payload, error } = buildOperationPayloadFromForm(operation, dockOperationValues, dockOperationForm.payload || {});
        if (error || !payload) {
            setDockOperationError(error || "Payload invalid. Please check your inputs.");
            return;
        }

        setDockOperationError("");
        setIsDockSending(true);
        try {
            const result = await aiChatService.executeAssistantOperation(operation, payload, dockSessionId);
            const successText = safeText(dockOperationForm.successMessage || result?.message || "Operation completed.", 220);
            appendDockMessage("assistant", `${assistantName}: ${successText}`);
            toast({
                title: "Automation completed",
                description: successText
            });
            setDockOperationForm(null);
            setDockOperationValues({});
        } catch (runError) {
            const fallback = safeText(
                dockOperationForm.failureMessage
                || runError?.response?.data?.message
                || runError?.message
                || "Automation could not be completed.",
                220
            );
            appendDockMessage("assistant", `${assistantName}: ${fallback}`);
            toast({
                title: "Automation failed",
                description: fallback,
                variant: "destructive"
            });
        } finally {
            setIsDockSending(false);
        }
    }, [
        appendDockMessage,
        assistantName,
        dockOperationForm,
        dockOperationValues,
        dockSessionId,
        isDockSending,
        toast
    ]);

    const handleDockAction = useCallback(async (rawAction = {}, options = {}) => {
        const action = normalizeAssistantAction(rawAction);
        if (!action) return false;

        const type = String(action.type || "").toLowerCase();
        if (type === "navigate") {
            const safeAction = sanitizeAssistantNavigateAction(action, normalizedRole);
            if (!safeAction?.navigateTo) {
                appendDockMessage("assistant", `${assistantName}: That route is not available for your role.`);
                return true;
            }
            navigate(safeAction.navigateTo);
            return true;
        }

        if (type === "prefill") {
            const value = safeText(action.value || action.message, 280);
            if (!value) return false;
            setQuickMessage(value);
            quickInputRef.current?.focus?.();
            return true;
        }

        if (type === "execute_operation") {
            return prepareDockExecuteOperation(action, options);
        }

        return false;
    }, [
        appendDockMessage,
        assistantName,
        navigate,
        normalizedRole,
        prepareDockExecuteOperation
    ]);

    const handleLocalThemeCommand = useCallback((message) => {
        const themeIntent = detectAssistantThemeIntent(message, getCurrentTheme());
        if (!themeIntent?.autoApply) return false;

        clearCommandTimeouts();

        const targetTheme = themeIntent.targetTheme === "dark" ? "dark" : "light";
        const previousTheme = themeIntent.previousTheme === "dark" ? "dark" : "light";
        const isAlreadyActive = previousTheme === targetTheme;
        const assistantReply = buildDockThemeReply({
            assistantName,
            studentCallName,
            isStudent,
            targetTheme,
            isAlreadyActive,
            incantation: themeIntent.incantation
        });

        setIsOpen(true);
        setIsNudgeVisible(false);

        queueCommandTimeout(() => {
            appendDockMessage("assistant", assistantReply);

            queueCommandTimeout(() => {
                const commitTheme = () => {
                    applyThemePreference(targetTheme);
                    persistTheme(targetTheme);
                };

                const withViewTransition = !lowMotion
                    && typeof document !== "undefined"
                    && typeof document.startViewTransition === "function";

                if (withViewTransition) {
                    document.startViewTransition(() => {
                        commitTheme();
                    });
                } else {
                    commitTheme();
                }

                const origin = getDockSpellOrigin();
                emitThemeSpell({
                    theme: targetTheme,
                    x: origin.x,
                    y: origin.y,
                    trigger: "utility-dock-theme-command"
                });
            }, THEME_COMMAND_APPLY_DELAY_MS);
        }, THEME_COMMAND_TYPING_DELAY_MS);

        return true;
    }, [
        assistantName,
        appendDockMessage,
        clearCommandTimeouts,
        getDockSpellOrigin,
        isStudent,
        lowMotion,
        queueCommandTimeout,
        studentCallName
    ]);

    const sendDockMessage = useCallback(async (message, options = {}) => {
        const trimmed = String(message || "").trim();
        if (!trimmed) return;
        if (isDockSending) return;

        const addUserMessage = options.addUserMessage !== false;
        setIsOpen(true);
        setIsNudgeVisible(false);

        if (addUserMessage) {
            appendDockMessage("user", trimmed);
        }

        const contextPayload = buildUtilityDockContextPayload({
            pathname: location.pathname,
            role: normalizedRole,
            user,
            checkinHistory
        });
        const commandPack = buildDockCommandPack({
            routeFamily: contextPayload.routeFamily,
            role: normalizedRole
        });

        if (handleLocalThemeCommand(trimmed)) {
            return;
        }

        const navigationIntent = detectAssistantNavigationIntent(trimmed, normalizedRole);
        if (navigationIntent?.navigateTo && navigationIntent.autoNavigate) {
            appendDockMessage(
                "assistant",
                `${assistantName}: opening ${navigationIntent.label || "requested page"} now.`
            );
            navigate(navigationIntent.navigateTo);
            return;
        }

        const operationIntent = detectDockOperationIntent(trimmed, {
            role: normalizedAutomationRole,
            routeFamily: contextPayload.routeFamily
        });
        if (operationIntent) {
            const handled = await handleDockAction(operationIntent, { source: "text_intent" });
            if (handled) return;
        }

        const liveIntent = detectDockLiveInsightIntent(trimmed, location.pathname);
        if (liveIntent) {
            const liveReply = buildLiveDockInsightReply({
                intent: liveIntent,
                context: contextPayload,
                assistantName,
                studentCallName
            });
            if (liveReply) {
                appendDockMessage("assistant", liveReply);
                return;
            }
        }

        setIsDockSending(true);
        try {
            if (trimmed.length > DOCK_API_MESSAGE_MAX_LENGTH) {
                appendDockMessage(
                    "assistant",
                    `${assistantName}: Please shorten your message and try again.`
                );
                return;
            }

            const fullApiMessage = composeDockContextMessage({
                message: trimmed,
                context: contextPayload,
                commandPack
            }) || trimmed;

            let apiMessage = fullApiMessage;
            if (apiMessage.length > DOCK_API_MESSAGE_MAX_LENGTH) {
                const compactMtss = contextPayload?.mtss
                    ? JSON.stringify({
                        metrics: safeList(contextPayload.mtss.metrics).slice(0, 4),
                        quickActions: safeList(contextPayload.mtss.quickActions).slice(0, 4),
                        table: safeList(contextPayload.mtss.table).slice(0, 1).map((table = {}) => ({
                            headers: safeList(table.headers).slice(0, 5),
                            rows: safeList(table.rows).slice(0, 3).map((row = []) =>
                                safeList(row).slice(0, 5).map((cell) => safeText(cell, 80))
                            )
                        }))
                    })
                    : "";
                const compactPageSnapshot = contextPayload?.pageSnapshot
                    ? JSON.stringify({
                        headings: safeList(contextPayload.pageSnapshot.headings).slice(0, 5),
                        metricHighlights: safeList(contextPayload.pageSnapshot.metricHighlights).slice(0, 4),
                        quickActions: safeList(contextPayload.pageSnapshot.quickActions).slice(0, 5),
                        lines: safeList(contextPayload.pageSnapshot.lines).slice(0, 8)
                    })
                    : "";
                const isQueryLikePrompt = QUERY_LIKE_DOCK_PROMPT_REGEX.test(trimmed);

                const compactApiMessage = [
                    "[DOCK_RUNTIME_CONTEXT]",
                    contextPayload?.route ? `route: ${String(contextPayload.route).trim()}` : "",
                    contextPayload?.routeFamily ? `route_family: ${String(contextPayload.routeFamily).trim()}` : "",
                    contextPayload?.role ? `role: ${String(contextPayload.role).trim()}` : "",
                    contextPayload?.userName ? `user_name: ${String(contextPayload.userName).trim()}` : "",
                    compactMtss ? `mtss_snapshot: ${compactMtss.slice(0, 900)}` : "",
                    compactPageSnapshot ? `page_snapshot_compact: ${compactPageSnapshot.slice(0, 700)}` : "",
                    "instruction: Use the current route and provided runtime context as trusted live page data. Answer directly and concisely.",
                    isQueryLikePrompt
                        ? "instruction_2: The user is asking a data/question prompt. Answer the question directly from the context. Do not switch pages unless explicitly asked to open a page."
                        : "",
                    "[/DOCK_RUNTIME_CONTEXT]",
                    `User message: ${trimmed}`
                ].filter(Boolean).join("\n");

                apiMessage = compactApiMessage.length <= DOCK_API_MESSAGE_MAX_LENGTH
                    ? compactApiMessage
                    : trimmed;
            }

            const response = await aiChatService.sendChatMessage(apiMessage, dockSessionId);
            const payload = response?.data || {};
            const nextSessionId = String(payload?.sessionId || "").trim();
            if (nextSessionId) {
                setDockSessionId(nextSessionId);
            }
            const assistantReply = String(payload?.message || "").trim();
            const assistantWidgets = trimDockWidgets(payload?.uiWidgets || []);
            const assistantActions = buildResponseActionEntries(payload);

            if (response?.success && (assistantReply || assistantWidgets.length > 0 || assistantActions.length > 0)) {
                appendDockMessage("assistant", assistantReply, {
                    widgets: assistantWidgets,
                    actions: assistantActions
                });
            } else {
                appendDockMessage(
                    "assistant",
                    `${assistantName}: I could not process that yet. Please retry once more.`
                );
            }
        } catch (error) {
            const fallbackMessage = String(error?.response?.data?.message || error?.message || "").trim();
            appendDockMessage(
                "assistant",
                isLengthLimitError(fallbackMessage)
                    ? `${assistantName}: I could not send the full page context for that request. Please try again.`
                    : fallbackMessage
                    ? `${assistantName}: ${fallbackMessage}`
                    : `${assistantName}: I hit a temporary issue. Try again in a few seconds.`
            );
        } finally {
            setIsDockSending(false);
        }
    }, [
        appendDockMessage,
        assistantName,
        checkinHistory,
        dockSessionId,
        handleDockAction,
        handleLocalThemeCommand,
        isDockSending,
        location.pathname,
        navigate,
        normalizedAutomationRole,
        normalizedRole,
        studentCallName,
        user
    ]);

    const handleSendQuickMessage = useCallback(async (event) => {
        event.preventDefault();
        const trimmed = String(quickMessage || "").trim();
        if (!trimmed) return;
        setQuickMessage("");
        await sendDockMessage(trimmed, { addUserMessage: true });
    }, [quickMessage, sendDockMessage]);

    const handleNudgePrimaryAction = useCallback((action) => {
        if (!action || typeof action !== "object") return;
        setIsNudgeVisible(false);

        const actionType = String(action.type || "").toLowerCase();
        if (actionType === "navigate") {
            const targetPath = String(action.navigateTo || "").trim();
            if (targetPath) {
                navigate(targetPath);
            }
            return;
        }

        const message = String(action.message || "").trim();
        if (!message) return;
        setIsOpen(true);
        void sendDockMessage(message, { addUserMessage: false });
    }, [navigate, sendDockMessage]);

    const dismissNudge = useCallback((snooze = false) => {
        setIsNudgeVisible(false);
        if (!snooze) return;

        const state = normalizeNudgeState(readNudgeState());
        writeNudgeState({
            ...state,
            snoozeUntil: Date.now() + NUDGE_SNOOZE_MS
        });
    }, []);

    useEffect(() => {
        if (!isAuthenticated || isOpen) return;
        if (location.pathname.startsWith(assistantChatPath) || location.pathname.startsWith("/ai-assistant")) return;
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

        const state = normalizeNudgeState(readNudgeState());
        const now = Date.now();
        if (state.snoozeUntil > now) return;
        if (state.count >= NUDGE_DAILY_LIMIT) return;
        if (state.lastAt && (now - state.lastAt) < NUDGE_COOLDOWN_MS) return;

        const nudgePayload = pickAdaptiveNudge({
            pathname: location.pathname,
            role: normalizedRole,
            assistantName,
            studentCallName,
            focusItems,
            quickActions
        });

        const timer = window.setTimeout(() => {
            const latest = normalizeNudgeState(readNudgeState());
            const latestNow = Date.now();
            if (latest.snoozeUntil > latestNow) return;
            if (latest.count >= NUDGE_DAILY_LIMIT) return;
            if (latest.lastAt && (latestNow - latest.lastAt) < NUDGE_COOLDOWN_MS) return;

            setActiveNudge(nudgePayload);
            setIsNudgeVisible(true);
            writeNudgeState({
                ...latest,
                count: latest.count + 1,
                lastAt: latestNow,
                lastPath: location.pathname
            });
        }, NUDGE_INITIAL_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [assistantChatPath, assistantName, focusItems, isAuthenticated, isOpen, location.pathname, normalizedRole, quickActions, studentCallName]);

    if (!isAuthenticated) {
        return null;
    }

    const hasQuickDraft = String(quickMessage || "").trim().length > 0;
    const hasDockConversation = dockMessages.length > 0;
    const shouldHideQuickLinks = hasQuickDraft || hasDockConversation || isDockSending;
    const effectiveDockPos = isCompactViewport ? null : dockPos;

    return (
        <div
            className="utility-dock fixed z-50 flex items-end gap-2"
            style={{
                bottom: effectiveDockPos ? `calc(4rem + ${-(effectiveDockPos.y || 0)}px)` : (isCompactViewport ? "1.25rem" : "4rem"),
                right: effectiveDockPos ? `calc(1.25rem + ${-(effectiveDockPos.x || 0)}px)` : "1.25rem",
                transition: dragStartRef.current ? "none" : "bottom 0.3s, right 0.3s",
            }}
        >
            <AnimatePresence>
                {isNudgeVisible && !isOpen && activeNudge && (
                    <motion.div
                        key="assistant-nudge"
                        initial={lowMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.97 }}
                        animate={lowMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={lowMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                        transition={lowMotion ? { duration: 0.12 } : { duration: 0.2, ease: "easeOut" }}
                        className="hidden md:block w-[296px] rounded-2xl border border-white/30 dark:border-white/[0.07] bg-white/80 dark:bg-[rgba(13,15,23,0.90)] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] p-3"
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white flex items-center justify-center shadow-sm">
                                <BellRing className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-violet-700 dark:text-violet-200">{activeNudge.title}</p>
                                <p className="text-[11px] text-slate-700 dark:text-slate-100 mt-0.5">{activeNudge.text}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => dismissNudge(false)}
                                className="p-1 rounded-md text-slate-600 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                aria-label="Dismiss assistant nudge"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleNudgePrimaryAction(activeNudge.primaryAction)}
                                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 hover:brightness-105 transition-all"
                            >
                                {activeNudge.primaryAction?.label || "Open assistant"}
                            </button>
                            {activeNudge.secondaryAction?.label && (
                                <button
                                    type="button"
                                    onClick={() => handleNudgePrimaryAction(activeNudge.secondaryAction)}
                                    className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-white/95 dark:bg-slate-800/90 border border-slate-300/85 dark:border-slate-400/45 hover:brightness-105 transition-all"
                                >
                                    {activeNudge.secondaryAction.label}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => dismissNudge(true)}
                                className="px-2 py-1.5 rounded-full text-[10px] font-semibold text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                            >
                                Snooze
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="assistant-panel"
                        initial={lowMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
                        animate={lowMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={lowMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                        transition={lowMotion ? { duration: 0.12 } : { duration: 0.22, ease: "easeOut" }}
                        className="w-[300px] max-w-[calc(100vw-4.75rem)] rounded-2xl border border-white/30 dark:border-white/[0.07] bg-white/80 dark:bg-[rgba(13,15,23,0.90)] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                                    {buttonLabel}
                                </p>
                                <p className="text-[11px] mt-0.5 text-slate-400 dark:text-slate-500">
                                    {isStudent ? "Personal helper on every page." : "Personal helper across your workspace."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close assistant dock"
                                className="p-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-slate-400 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/[0.14] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {!shouldHideQuickLinks && (
                            <div className="mt-2.5 rounded-xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06] divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                                {quickActionItems.map((entry) => (
                                    <button
                                        key={entry.label}
                                        type="button"
                                        onClick={() => handleQuickAction(entry.navigateTo)}
                                        className="w-full px-3 py-2.5 text-left bg-white/50 dark:bg-white/[0.03] hover:bg-white/90 dark:hover:bg-white/[0.07] active:bg-white/70 dark:active:bg-white/[0.05] transition-colors"
                                    >
                                        <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-100 flex items-center justify-between gap-2">
                                            <span>{entry.label}</span>
                                            <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{entry.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
                            <div
                                ref={dockViewportRef}
                                className="max-h-44 overflow-y-auto px-2.5 py-2 space-y-1.5"
                            >
                                {/* {dockMessages.length === 0 && !isDockSending && (
                                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 px-1">
                                        Ask anything from this page. I can respond in-place without moving you to another screen.
                                    </p>
                                )} */}
                                {dockMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`max-w-[92%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-relaxed ${message.role === "user"
                                                ? "ml-auto bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-[0_2px_8px_rgba(6,182,212,0.28)]"
                                                : "mr-auto bg-white/80 dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.07] text-slate-700 dark:text-slate-100"
                                            }`}
                                    >
                                        {message.role === "assistant" ? (
                                            <div className="dock-markdown [&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_blockquote]:my-1 [&_table]:my-1.5 [&_h1]:!text-[13px] [&_h2]:!text-[12px] [&_h3]:!text-[12px] [&_code]:!text-[10px] [&_code]:leading-relaxed">
                                                <MarkdownRenderer
                                                    content={preprocessDockMarkdown(message.content)}
                                                    isUser={false}
                                                />
                                            </div>
                                        ) : (
                                            message.content
                                        )}
                                        {message.role === "assistant" && safeList(message.widgets).length > 0 && (
                                            <UtilityDockWidgetPreview
                                                widgets={message.widgets}
                                                onAction={(action) => {
                                                    void handleDockAction(action, { source: "widget" });
                                                }}
                                            />
                                        )}
                                        {message.role === "assistant" && safeList(message.actions).length > 0 && (
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {message.actions.map((entry, index) => (
                                                    <button
                                                        key={`${entry.label}-${index}`}
                                                        type="button"
                                                        onClick={() => {
                                                            void handleDockAction(entry.action, { source: "message_action" });
                                                        }}
                                                        className="rounded-full border border-black/[0.08] dark:border-white/[0.10] bg-white/90 dark:bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.10] transition-colors"
                                                    >
                                                        {entry.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isDockSending && (
                                    <div className="mr-auto inline-flex items-center gap-1 rounded-2xl border border-cyan-200/55 dark:border-cyan-300/22 bg-white/90 dark:bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:120ms]" />
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse [animation-delay:240ms]" />
                                        <span className="ml-1">{assistantName} is thinking...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {dockOperationForm && (
                            <form
                                onSubmit={submitDockOperationForm}
                                className="mt-2 rounded-2xl border border-cyan-300/55 dark:border-cyan-300/25 bg-white/82 dark:bg-slate-950/52 p-2.5 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-200">
                                            {dockOperationForm.label || "Execute Operation"}
                                        </p>
                                        {dockOperationForm.description && (
                                            <p className="text-[10px] mt-0.5 text-slate-600 dark:text-slate-300">
                                                {dockOperationForm.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={cancelDockOperationForm}
                                        className="rounded-md border border-cyan-300/60 dark:border-cyan-300/30 bg-white/85 dark:bg-slate-900/65 px-1.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-50/90 dark:hover:bg-cyan-500/15 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                    {safeList(dockOperationForm.fields).map((field) => {
                                        const key = String(field?.key || "").trim();
                                        if (!key) return null;
                                        const fieldType = String(field?.type || "text").toLowerCase();
                                        const label = String(field?.label || key);
                                        const value = dockOperationValues?.[key] ?? "";
                                        const required = Boolean(field?.required);
                                        const placeholder = String(field?.placeholder || "");
                                        const inputClass = "w-full rounded-lg border border-cyan-300/55 dark:border-cyan-300/30 bg-white/96 dark:bg-slate-900/72 px-2 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/70";

                                        return (
                                            <label key={key} className="block">
                                                <span className="mb-0.5 block text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                                    {label}{required ? " *" : ""}
                                                </span>
                                                {fieldType === "textarea" && (
                                                    <textarea
                                                        rows={2}
                                                        value={String(value)}
                                                        onChange={(event) => handleDockOperationFieldChange(key, event.target.value)}
                                                        placeholder={placeholder}
                                                        className={inputClass}
                                                    />
                                                )}
                                                {fieldType === "select" && (
                                                    <select
                                                        value={String(value)}
                                                        onChange={(event) => handleDockOperationFieldChange(key, event.target.value)}
                                                        className={inputClass}
                                                    >
                                                        {safeList(field?.options).map((option) => {
                                                            const optionValue = String(option);
                                                            return (
                                                                <option key={`${key}-${optionValue}`} value={optionValue}>
                                                                    {optionValue}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )}
                                                {fieldType !== "textarea" && fieldType !== "select" && (
                                                    <input
                                                        type={fieldType === "number" ? "number" : "text"}
                                                        value={String(value)}
                                                        onChange={(event) => handleDockOperationFieldChange(key, event.target.value)}
                                                        placeholder={placeholder}
                                                        className={inputClass}
                                                    />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>

                                {dockOperationError && (
                                    <p className="text-[10px] text-rose-600 dark:text-rose-300">{dockOperationError}</p>
                                )}

                                <div className="flex items-center justify-end gap-1.5">
                                    <button
                                        type="button"
                                        onClick={cancelDockOperationForm}
                                        className="rounded-full border border-cyan-300/65 dark:border-cyan-300/35 bg-white/90 dark:bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-50/90 dark:hover:bg-cyan-500/15 transition-colors"
                                        disabled={isDockSending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 px-2.5 py-1 text-[10px] font-bold text-white hover:brightness-105 transition-all disabled:opacity-60"
                                        disabled={isDockSending}
                                    >
                                        {isDockSending ? "Running..." : "Run Operation"}
                                    </button>
                                </div>
                            </form>
                        )}

                        <form onSubmit={handleSendQuickMessage} className="mt-3 pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex gap-1.5">
                            <input
                                ref={quickInputRef}
                                type="text"
                                value={quickMessage}
                                onChange={(event) => setQuickMessage(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && event.shiftKey) return;
                                }}
                                placeholder={`Message ${assistantName}...`}
                                className="flex-1 px-3 py-2 rounded-xl !bg-white/80 !text-slate-900 !placeholder:text-slate-400 dark:!bg-white/[0.07] dark:!text-slate-100 dark:!placeholder:text-slate-500 border border-black/[0.07] dark:border-white/[0.08] text-[12px] focus:outline-none focus:ring-2 focus:ring-cyan-500/25 dark:focus:ring-cyan-400/25 transition-shadow"
                                style={{ WebkitTextFillColor: "currentColor" }}
                            />
                            <button
                                ref={quickSendButtonRef}
                                type="submit"
                                className="px-3 py-2 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white hover:brightness-110 active:brightness-95 transition-all disabled:opacity-35 shadow-[0_2px_8px_rgba(6,182,212,0.30)] flex-shrink-0"
                                disabled={!quickMessage.trim() || isDockSending}
                                aria-label="Send quick message to assistant"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                ref={dragRef}
                type="button"
                aria-label={isOpen ? "Close AI Assistant launcher" : "Open AI Assistant launcher"}
                aria-expanded={isOpen}
                onClick={() => {
                    if (wasDragRef.current) { wasDragRef.current = false; return; }
                    setIsOpen((prev) => !prev);
                    setIsNudgeVisible(false);
                }}
                onMouseDown={handleDragStart}
                whileTap={lowMotion ? {} : { scale: 0.94 }}
                whileHover={lowMotion ? {} : { scale: 1.05 }}
                animate={lowMotion ? {} : { y: [0, -2, 0] }}
                transition={lowMotion ? { duration: 0.12 } : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-10 w-10 md:h-14 md:w-14 rounded-full border border-cyan-200/60 dark:border-cyan-200/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(230,247,255,0.88),rgba(253,236,252,0.86))] dark:bg-[linear-gradient(145deg,rgba(11,26,48,0.94),rgba(20,38,66,0.92),rgba(44,22,52,0.9))] shadow-[0_18px_40px_rgba(6,182,212,0.24)] text-cyan-700 dark:text-cyan-200 backdrop-blur-xl cursor-pointer md:cursor-grab md:active:cursor-grabbing"
            >
                <motion.span
                    className="pointer-events-none absolute -inset-1 rounded-full border border-cyan-300/50 dark:border-cyan-300/35"
                    animate={lowMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.65, 0.25, 0.65] }}
                    transition={lowMotion ? {} : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="absolute inset-0 rounded-full bg-grid-small/[0.08] dark:bg-grid-small-dark/[0.16] pointer-events-none" />
                <div className="relative flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 md:w-6 md:h-6" />
                    <span className="absolute -top-2.5 -right-3 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm">
                        AI
                    </span>
                </div>
            </motion.button>
        </div>
    );
});

UtilityDock.displayName = "UtilityDock";
export default UtilityDock;
