import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Plus, Loader2, Volume2, VolumeX, Pencil, Check, X, PanelLeft, PanelLeftClose, History, Clock3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { useDispatch, useSelector } from 'react-redux';
import MessageStream from '@/features/assistant/chat/MessageStream';
import useRafThrottle from '@/hooks/useRafThrottle';
import {
    detectAssistantNavigationIntent,
    detectAssistantThemeIntent,
    sanitizeAssistantNavigateAction
} from '@/utils/studentAssistantNavigator';
import {
    applyThemePreference,
    emitThemeSpell,
    getStoredTheme,
    persistTheme
} from '@/lib/theme';
import {
    sendMessage,
    loadConversations,
    loadConversationHistory,
    loadAssistantProfile,
    saveAssistantProfile,
    startNewConversation,
    addAIMessage,
    addUserMessage,
    setTyping,
    setBuddyAnimation,
    resetBuddyToIdle,
    toggleSound,
    selectMessages,
    selectSessionId,
    selectIsLoading,
    selectIsTyping,
    selectBuddyExpression,
    selectBuddyAnimation,
    selectSoundEnabled,
    selectConversations,
    selectConversationsLoading,
    selectHistoryLoading,
    selectAssistantProfile,
    selectAssistantLoading,
    selectAssistantSaving
} from '@/store/slices/aiChatSlice';
import aiChatService from '@/services/aiChatService';
import './StudentAIChatPage.css';
import '@/pages/styles/student-ios-system.css';

const CHAT_COACH_STORAGE_KEY = 'student_ai_chat_coach_v1';
const CHAT_COACH_IDLE_MS = 95 * 1000;
const CHAT_COACH_COOLDOWN_MS = 20 * 60 * 1000;
const CHAT_COACH_SNOOZE_MS = 2 * 60 * 60 * 1000;
const CHAT_COACH_DAILY_LIMIT = 4;
const CHAT_COACH_SESSION_LIMIT = 2;
const CONVERSATIONS_REFRESH_COOLDOWN_MS = 10000;
const CHAT_MESSAGE_WINDOW_SIZE = 120;
const CHAT_MESSAGE_WINDOW_STEP = 80;
const THEME_COMMAND_TYPING_DELAY_MS = 420;
const THEME_COMMAND_APPLY_DELAY_MS = 360;

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getCurrentTheme = () => {
    if (typeof document !== 'undefined') {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return getStoredTheme();
};

const hashSeed = (value = '') => {
    let hash = 0;
    const normalized = String(value || '');
    for (let i = 0; i < normalized.length; i += 1) {
        hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const pickThemeReply = (seed, variants = []) => {
    if (!Array.isArray(variants) || variants.length === 0) return '';
    return variants[hashSeed(seed) % variants.length];
};

const buildThemeCommandReply = ({
    themeIntent,
    assistantName = 'Nova',
    isStudentRole = true,
    studentCallName = 'there',
    seed = ''
} = {}) => {
    const targetTheme = themeIntent?.targetTheme === 'dark' ? 'dark' : 'light';
    const incantation = String(themeIntent?.incantation || (targetTheme === 'dark' ? 'Nox' : 'Lumos Maxima'));

    const studentOpeners = targetTheme === 'dark'
        ? [
            `Okay ${studentCallName}, let's shift your study room into Dark Mode.`,
            `Great call ${studentCallName}, switching your view to Dark Mode now.`,
            `Nice choice, I'm dimming the workspace into Dark Mode for better focus.`
        ]
        : [
            `Perfect ${studentCallName}, let's brighten your study space with Light Mode.`,
            `Great, bringing your workspace back to Light Mode now.`,
            `Done, we're moving into Light Mode for a brighter session.`
        ];

    const staffOpeners = targetTheme === 'dark'
        ? [
            `Great choice, switching your workspace to Dark Mode now.`,
            `Absolutely, applying Dark Mode so your dashboard feels calmer.`,
            `On it, moving your workspace into Dark Mode.`
        ]
        : [
            `Nice, switching your workspace to Light Mode now.`,
            `Absolutely, bringing your dashboard back to Light Mode.`,
            `Done, restoring Light Mode for a brighter workspace.`
        ];

    const noChangeLines = targetTheme === 'dark'
        ? [
            `You're already in Dark Mode, but I can refresh it for you.`,
            `Dark Mode is already active. Recasting for style.`
        ]
        : [
            `You're already in Light Mode, but I can refresh it for you.`,
            `Light Mode is already active. Recasting for style.`
        ];

    const noChange = themeIntent?.previousTheme === targetTheme;
    const openerVariants = noChange ? noChangeLines : (isStudentRole ? studentOpeners : staffOpeners);
    const opener = pickThemeReply(`${seed}:${assistantName}:${targetTheme}:${themeIntent?.previousTheme || ''}`, openerVariants);

    return `${opener}\n\n${incantation}.`;
};

const readCoachState = (userKey = 'student') => {
    if (typeof window === 'undefined') {
        return { day: getTodayKey(), count: 0, lastAt: 0, snoozeUntil: 0 };
    }

    try {
        const raw = window.localStorage.getItem(`${CHAT_COACH_STORAGE_KEY}:${userKey}`);
        if (!raw) return { day: getTodayKey(), count: 0, lastAt: 0, snoozeUntil: 0 };
        const parsed = JSON.parse(raw);
        return {
            day: String(parsed?.day || getTodayKey()),
            count: Number(parsed?.count || 0),
            lastAt: Number(parsed?.lastAt || 0),
            snoozeUntil: Number(parsed?.snoozeUntil || 0)
        };
    } catch {
        return { day: getTodayKey(), count: 0, lastAt: 0, snoozeUntil: 0 };
    }
};

const normalizeCoachState = (state) => {
    const today = getTodayKey();
    if (String(state?.day || '') !== today) {
        return {
            day: today,
            count: 0,
            lastAt: 0,
            snoozeUntil: Number(state?.snoozeUntil || 0)
        };
    }

    return {
        day: today,
        count: Number(state?.count || 0),
        lastAt: Number(state?.lastAt || 0),
        snoozeUntil: Number(state?.snoozeUntil || 0)
    };
};

const writeCoachState = (userKey = 'student', state = {}) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(`${CHAT_COACH_STORAGE_KEY}:${userKey}`, JSON.stringify(state));
    } catch {
        // no-op
    }
};

const buildCoachNudge = ({
    assistantName = 'Nova',
    studentName = 'there',
    focusItems = [],
    quickActions = [],
    messages = []
} = {}) => {
    const latestAssistantMessage = [...messages].reverse().find((item) => item?.role === 'assistant');
    const latestAssistantText = String(latestAssistantMessage?.content || '').trim();
    const hasQuestion = /\?\s*$/.test(latestAssistantText);
    const primaryFocus = String(focusItems?.[0] || '').trim();
    const primaryAction = String(quickActions?.[0] || '').trim();

    if (hasQuestion) {
        return {
            title: `${assistantName} follow-up`,
            text: `I can help you answer the last question step by step, ${studentName}.`,
            suggestion: 'Help me answer your last question in simple steps with one concrete action.'
        };
    }

    if (primaryFocus) {
        return {
            title: `${assistantName} quick check-in`,
            text: `Still want to focus on "${primaryFocus}"? I can break it into a quick mini plan.`,
            suggestion: `Help me make a 20-minute plan for this focus: ${primaryFocus}.`
        };
    }

    if (primaryAction) {
        return {
            title: `${assistantName} ready when you are`,
            text: `Want to continue with "${primaryAction}"?`,
            suggestion: primaryAction
        };
    }

    return {
        title: `${assistantName} mini boost`,
        text: `Need a short momentum boost, ${studentName}? I can propose your next best action now.`,
        suggestion: 'Give me one high-impact study action I can do in the next 15 minutes.'
    };
};

// Particle decorations (Hub-style)
const ChatParticle = React.memo(({ delay = 0, size = 'sm', type = 'dot', top = '20%', left = '10%' }) => {
    const sizeClasses = {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    const shapes = {
        dot: 'rounded-full bg-cyan-400/25 dark:bg-cyan-300/20',
        ring: 'rounded-full border-2 border-amber-400/25 dark:border-amber-300/20',
        cross: 'rotate-45 bg-gradient-to-br from-pink-400/20 to-transparent dark:from-pink-300/15 dark:to-transparent',
        diamond: 'rotate-45 bg-lime-400/22 dark:bg-lime-300/16'
    };

    return (
        <motion.div
            className={`absolute ${sizeClasses[size]} ${shapes[type]} pointer-events-none`}
            style={{ top, left }}
            animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
                rotate: [0, 12, 0]
            }}
            transition={{
                duration: 4 + delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay
            }}
        />
    );
});
ChatParticle.displayName = 'ChatParticle';

// AI Buddy Character Component
const AIBuddy = React.memo(({ expression, animation }) => {
    const animationClass = animation ? `buddy-${animation}` : '';

    return (
        <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-cyan-300/45 via-pink-300/35 to-lime-300/30 blur-xl chat-pill-glow" />
            <motion.div
                className={`text-5xl sm:text-6xl ${animationClass}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                {expression}
            </motion.div>

            {/* Sparkle effects */}
            {animation === 'celebrate' && (
                <>
                    <motion.div
                        className="absolute -top-2 -right-2 text-yellow-400 text-2xl sparkle"
                        style={{ animationDelay: '0s' }}
                    >
                        ✨
                    </motion.div>
                    <motion.div
                        className="absolute -bottom-2 -left-2 text-pink-400 text-xl sparkle"
                        style={{ animationDelay: '0.3s' }}
                    >
                        💫
                    </motion.div>
                </>
            )}
        </div>
    );
});
AIBuddy.displayName = 'AIBuddy';

// Main component
export default function StudentAIChatPage() {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const authUser = useSelector((state) => state.auth?.user || null);

    // Redux state
    const messages = useSelector(selectMessages);
    const sessionId = useSelector(selectSessionId);
    const isLoading = useSelector(selectIsLoading);
    const isTyping = useSelector(selectIsTyping);
    const buddyExpression = useSelector(selectBuddyExpression);
    const buddyAnimation = useSelector(selectBuddyAnimation);
    const soundEnabled = useSelector(selectSoundEnabled);
    const conversations = useSelector(selectConversations);
    const conversationsLoading = useSelector(selectConversationsLoading);
    const historyLoading = useSelector(selectHistoryLoading);
    const assistantProfile = useSelector(selectAssistantProfile);
    const assistantLoading = useSelector(selectAssistantLoading);
    const assistantSaving = useSelector(selectAssistantSaving);
    const assistantName = assistantProfile?.assistant?.assistantName || 'Nova';
    const dailyFocus = useMemo(
        () => (Array.isArray(assistantProfile?.assistant?.daily?.focusItems)
            ? assistantProfile.assistant.daily.focusItems
            : []),
        [assistantProfile]
    );
    const dailyQuickActions = useMemo(
        () => (Array.isArray(assistantProfile?.assistant?.daily?.quickActions)
            ? assistantProfile.assistant.daily.quickActions
            : []),
        [assistantProfile]
    );
    const twinProfile = assistantProfile?.twin || {};
    const twinRiskLevel = String(twinProfile?.riskLevel || 'low').toLowerCase();
    const twinConfidencePct = Math.max(0, Math.min(100, Math.round(Number(twinProfile?.confidenceScore || 0.5) * 100)));
    const [isNicknameEditorOpen, setIsNicknameEditorOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [nicknameDraft, setNicknameDraft] = useState(assistantName);
    const [inputValue, setLocalInputValue] = useState('');
    const [coachNudge, setCoachNudge] = useState(null);
    const [isCoachVisible, setIsCoachVisible] = useState(false);
    const [manualVisibleCount, setManualVisibleCount] = useState(CHAT_MESSAGE_WINDOW_SIZE);

    const messagesScrollRef = useRef(null);
    const inputRef = useRef(null);
    const sendButtonRef = useRef(null);
    const nicknameInputRef = useRef(null);
    const processedDockNonceRef = useRef(null);
    const lastInteractionAtRef = useRef(0);
    const sessionCoachCountRef = useRef(0);
    const lastConversationsRefreshAtRef = useRef(0);
    const refreshConversationsTimeoutRef = useRef(null);
    const themeCommandTimeoutsRef = useRef([]);
    const displayedAssistantName = isNicknameEditorOpen ? (nicknameDraft.trim() || assistantName) : assistantName;
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const normalizedRole = useMemo(
        () => String(authUser?.role || '').trim().toLowerCase(),
        [authUser?.role]
    );
    const isStudentRole = normalizedRole === 'student';
    const isTeacherRole = useMemo(
        () => ['teacher', 'se_teacher'].includes(normalizedRole),
        [normalizedRole]
    );
    const isPrincipalRole = useMemo(
        () => ['head_unit', 'principal'].includes(normalizedRole),
        [normalizedRole]
    );
    const isLeadershipRole = useMemo(
        () => ['head_unit', 'principal', 'directorate', 'admin', 'superadmin'].includes(normalizedRole),
        [normalizedRole]
    );
    const canExecuteAutomation = useMemo(
        () => ['teacher', 'head_unit', 'principal', 'directorate', 'admin', 'superadmin'].includes(normalizedRole),
        [normalizedRole]
    );
    const studentCallName = useMemo(() => {
        const nickname = String(authUser?.nickname || '').trim();
        if (nickname) return nickname;
        const name = String(authUser?.name || '').trim();
        if (!name) return 'there';
        return name.split(/\s+/)[0] || 'there';
    }, [authUser?.name, authUser?.nickname]);
    const assistantSupportTagline = useMemo(() => {
        if (isStudentRole) return 'daily school support';
        if (isPrincipalRole || isLeadershipRole) return 'leadership planning and MTSS decision support';
        if (isTeacherRole) return 'classroom and MTSS intervention support';
        return 'daily work support';
    }, [isLeadershipRole, isPrincipalRole, isStudentRole, isTeacherRole]);
    const assistantWelcomeSubtitle = useMemo(() => {
        if (isStudentRole) {
            return 'I can help with daily planning, homework strategy, MTSS check-ins, and personal study coaching.';
        }
        if (isPrincipalRole || isLeadershipRole) {
            return 'I can help with executive MTSS briefing, team priority triage, escalation planning, and dashboard-driven decisions.';
        }
        if (isTeacherRole) {
            return 'I can help with intervention planning, progress notes, classroom follow-up, and student support workflow.';
        }
        return 'I can help with workday planning, MTSS follow-up, check-in workflow, and role-specific dashboard actions.';
    }, [isLeadershipRole, isPrincipalRole, isStudentRole, isTeacherRole]);
    const coachStateUserKey = useMemo(() => {
        const seed = authUser?.email || authUser?.id || authUser?._id || authUser?.username || 'student';
        return String(seed).replace(/[^a-zA-Z0-9_.@-]/g, '_');
    }, [authUser?.email, authUser?.id, authUser?._id, authUser?.username]);

    // Particles configuration
    const particles = useMemo(() => [
        { delay: 0, size: 'sm', type: 'dot', top: '8%', left: '15%' },
        { delay: 0.5, size: 'md', type: 'ring', top: '25%', left: '85%' },
        { delay: 1, size: 'xs', type: 'cross', top: '45%', left: '8%' },
        { delay: 1.5, size: 'sm', type: 'diamond', top: '65%', left: '90%' },
        { delay: 2, size: 'md', type: 'dot', top: '80%', left: '12%' },
        { delay: 2.5, size: 'xs', type: 'ring', top: '15%', left: '70%' },
        { delay: 3, size: 'sm', type: 'cross', top: '55%', left: '75%' },
        { delay: 0.8, size: 'xs', type: 'diamond', top: '35%', left: '25%' }
    ], []);
    const effectiveVisibleCount = autoScrollEnabled
        ? CHAT_MESSAGE_WINDOW_SIZE
        : Math.max(CHAT_MESSAGE_WINDOW_SIZE, manualVisibleCount);
    const visibleStartIndex = Math.max(0, messages.length - effectiveVisibleCount);
    const renderedMessages = useMemo(
        () => messages.slice(visibleStartIndex),
        [messages, visibleStartIndex]
    );
    const hiddenMessageCount = visibleStartIndex;
    const canLoadOlderMessages = hiddenMessageCount > 0;

    useEffect(() => {
        lastInteractionAtRef.current = Date.now();
    }, []);

    const scrollToBottom = useCallback((behavior = 'smooth') => {
        const element = messagesScrollRef.current;
        if (!element) return;
        element.scrollTo({
            top: element.scrollHeight,
            behavior
        });
    }, []);

    const checkNearBottom = useCallback(() => {
        const element = messagesScrollRef.current;
        if (!element) return true;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        return distanceFromBottom < 140;
    }, []);

    useEffect(() => {
        if (autoScrollEnabled) {
            scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
        }
    }, [messages, isTyping, autoScrollEnabled, scrollToBottom]);

    // Bootstrap: load assistant profile + latest conversation history
    useEffect(() => {
        let isMounted = true;

        const bootstrapChat = async () => {
            try {
                const items = await dispatch(loadConversations()).unwrap();
                if (isMounted && Array.isArray(items) && items.length > 0) {
                    await dispatch(loadConversationHistory({
                        sessionId: items[0].sessionId,
                        limit: 120
                    }));
                    setAutoScrollEnabled(true);
                    setManualVisibleCount(CHAT_MESSAGE_WINDOW_SIZE);
                }
            } catch {
                // no-op, handled by slice error state
            }

            dispatch(loadAssistantProfile());
        };

        bootstrapChat();

        return () => {
            isMounted = false;
        };
    }, [dispatch]);

    useEffect(() => {
        if (!isNicknameEditorOpen) {
            setNicknameDraft(assistantName);
        }
    }, [assistantName, isNicknameEditorOpen]);

    useEffect(() => {
        if (isNicknameEditorOpen) {
            nicknameInputRef.current?.focus();
            nicknameInputRef.current?.select();
        }
    }, [isNicknameEditorOpen]);

    useEffect(() => () => {
        if (refreshConversationsTimeoutRef.current) {
            clearTimeout(refreshConversationsTimeoutRef.current);
            refreshConversationsTimeoutRef.current = null;
        }
        themeCommandTimeoutsRef.current.forEach((timerId) => window.clearTimeout(timerId));
        themeCommandTimeoutsRef.current = [];
    }, []);

    useEffect(() => {
        lastInteractionAtRef.current = Date.now();
        setIsCoachVisible(false);
        setCoachNudge(null);
        sessionCoachCountRef.current = 0;
        setManualVisibleCount(CHAT_MESSAGE_WINDOW_SIZE);
    }, [sessionId]);

    useEffect(() => {
        if (messages.length === 0) {
            setIsCoachVisible(false);
            return;
        }
        lastInteractionAtRef.current = Date.now();
        setIsCoachVisible(false);
    }, [messages.length]);

    useEffect(() => {
        if (messages.length === 0) return;
        if (isTyping || isLoading) return;
        if (inputValue.trim()) return;
        if (isNicknameEditorOpen || isHistoryOpen) return;
        if (sessionCoachCountRef.current >= CHAT_COACH_SESSION_LIMIT) return;

        const timer = window.setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            if (!checkNearBottom()) return;

            const now = Date.now();
            if ((now - lastInteractionAtRef.current) < CHAT_COACH_IDLE_MS) return;

            const persisted = normalizeCoachState(readCoachState(coachStateUserKey));
            if (persisted.snoozeUntil > now) return;
            if (persisted.count >= CHAT_COACH_DAILY_LIMIT) return;
            if (persisted.lastAt && (now - persisted.lastAt) < CHAT_COACH_COOLDOWN_MS) return;

            const payload = buildCoachNudge({
                assistantName,
                studentName: studentCallName,
                focusItems: dailyFocus,
                quickActions: dailyQuickActions,
                messages
            });

            setCoachNudge(payload);
            setIsCoachVisible(true);
            sessionCoachCountRef.current += 1;
            lastInteractionAtRef.current = now;

            writeCoachState(coachStateUserKey, {
                ...persisted,
                count: persisted.count + 1,
                lastAt: now
            });
        }, 15000);

        return () => window.clearInterval(timer);
    }, [
        assistantName,
        checkNearBottom,
        coachStateUserKey,
        dailyFocus,
        dailyQuickActions,
        inputValue,
        isHistoryOpen,
        isLoading,
        isNicknameEditorOpen,
        isTyping,
        messages,
        studentCallName
    ]);

    // Reset buddy animation after it completes
    useEffect(() => {
        if (buddyAnimation && buddyAnimation !== 'idle' && buddyAnimation !== 'pulse') {
            const timer = setTimeout(() => {
                dispatch(resetBuddyToIdle());
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [buddyAnimation, dispatch]);

    const scheduleConversationsRefresh = useCallback((force = false) => {
        const now = Date.now();
        const elapsed = now - lastConversationsRefreshAtRef.current;

        if (refreshConversationsTimeoutRef.current) {
            clearTimeout(refreshConversationsTimeoutRef.current);
            refreshConversationsTimeoutRef.current = null;
        }

        if (force || elapsed >= CONVERSATIONS_REFRESH_COOLDOWN_MS) {
            lastConversationsRefreshAtRef.current = now;
            dispatch(loadConversations());
            return;
        }

        const remaining = CONVERSATIONS_REFRESH_COOLDOWN_MS - elapsed;
        refreshConversationsTimeoutRef.current = setTimeout(() => {
            lastConversationsRefreshAtRef.current = Date.now();
            dispatch(loadConversations());
            refreshConversationsTimeoutRef.current = null;
        }, remaining);
    }, [dispatch]);

    // Handlers (memoized for performance)
    const handleStartNewChat = useCallback(() => {
        setIsCoachVisible(false);
        setCoachNudge(null);
        lastInteractionAtRef.current = Date.now();
        sessionCoachCountRef.current = 0;
        dispatch(startNewConversation())
            .unwrap()
            .then(() => {
                setAutoScrollEnabled(true);
                setManualVisibleCount(CHAT_MESSAGE_WINDOW_SIZE);
                setIsHistoryOpen(false);
                scheduleConversationsRefresh(true);
                toast({
                    title: "New chat started! 🎉",
                    description: "Start chatting with your AI Assistant"
                });
            })
            .catch(() => {
                toast({
                    title: "Failed to start new chat",
                    description: "Please try again!",
                    variant: "destructive"
                });
            });
    }, [dispatch, scheduleConversationsRefresh, toast]);

    const handleClientAction = useCallback((clientAction) => {
        const safeAction = sanitizeAssistantNavigateAction(clientAction, normalizedRole);
        if (!safeAction) return false;

        const targetPath = String(safeAction.navigateTo || '').trim();
        if (!targetPath) return false;
        if (location.pathname === targetPath) return true;

        const workspaceLabel = isStudentRole ? 'student workspace' : 'your workspace';

        const actionLabel = safeAction.label || 'requested page';
        toast({
            title: `Opening ${actionLabel}`,
            description: `Redirecting inside ${workspaceLabel}...`
        });

        dispatch(setBuddyAnimation('wave'));
        navigate(targetPath, {
            state: {
                fromAIChat: true,
                aiIntent: safeAction.intent || null
            }
        });
        return true;
    }, [dispatch, isStudentRole, location.pathname, navigate, normalizedRole, toast]);

    const resolveSingleSelectionFromPrompt = useCallback((label, options = [], fallbackPrompt = '') => {
        if (typeof window === 'undefined') return null;
        const list = Array.isArray(options) ? options : [];
        if (list.length > 0) {
            const listText = list
                .slice(0, 20)
                .map((option, index) => `${index + 1}. ${option.label || option.name || option.id || 'Option'} [${option.id}]`)
                .join('\n');
            const rawInput = window.prompt(`${label}\n${listText}`, '');
            if (rawInput === null) return null;
            const raw = String(rawInput || '').trim();
            if (!raw) return null;
            const selectedNumber = Number(raw);
            if (Number.isFinite(selectedNumber) && selectedNumber >= 1 && selectedNumber <= list.length) {
                return String(list[selectedNumber - 1]?.id || '').trim() || null;
            }
            return raw;
        }

        const fallbackInput = window.prompt(fallbackPrompt || label, '');
        if (fallbackInput === null) return null;
        const parsed = String(fallbackInput || '').trim();
        return parsed || null;
    }, []);

    const resolveMultipleSelectionFromPrompt = useCallback((label, options = [], fallbackPrompt = '') => {
        if (typeof window === 'undefined') return null;
        const list = Array.isArray(options) ? options : [];
        if (list.length > 0) {
            const listText = list
                .slice(0, 20)
                .map((option, index) => `${index + 1}. ${option.label || option.name || option.id || 'Option'} [${option.id}]`)
                .join('\n');
            const rawInput = window.prompt(`${label}\n${listText}\nUse comma-separated numbers or IDs`, '');
            if (rawInput === null) return null;
            const raw = String(rawInput || '').trim();
            if (!raw) return null;
            const tokens = raw.split(',').map((token) => token.trim()).filter(Boolean);
            const ids = tokens.map((token) => {
                const selectedNumber = Number(token);
                if (Number.isFinite(selectedNumber) && selectedNumber >= 1 && selectedNumber <= list.length) {
                    return String(list[selectedNumber - 1]?.id || '').trim();
                }
                return token;
            }).filter(Boolean);
            return ids.length > 0 ? Array.from(new Set(ids)) : null;
        }

        const fallbackInput = window.prompt(fallbackPrompt || label, '');
        if (fallbackInput === null) return null;
        const ids = String(fallbackInput || '')
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean);
        return ids.length > 0 ? Array.from(new Set(ids)) : null;
    }, []);

    const buildCreateInterventionPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const studentOptions = Array.isArray(payload.studentOptions) ? payload.studentOptions : [];
        delete payload.studentOptions;

        if (!payload.studentId) {
            if (studentOptions.length > 0) {
                const listText = studentOptions
                    .slice(0, 8)
                    .map((student, index) => {
                        const gradeClass = [student.grade, student.className].filter(Boolean).join(' / ');
                        return `${index + 1}. ${student.name || 'Student'}${gradeClass ? ` (${gradeClass})` : ''} [${student.id}]`;
                    })
                    .join('\n');
                const studentInput = window.prompt(
                    `Select student by number or paste Student ID:\n${listText}`,
                    ''
                );
                if (studentInput === null) return null;
                const raw = String(studentInput || '').trim();
                if (!raw) return null;
                const selectedNumber = Number(raw);
                if (Number.isFinite(selectedNumber) && selectedNumber >= 1 && selectedNumber <= studentOptions.length) {
                    payload.studentId = String(studentOptions[selectedNumber - 1]?.id || '').trim();
                } else {
                    payload.studentId = raw;
                }
            } else {
                const studentIdInput = window.prompt('Enter Student ID for intervention submission:', '');
                if (studentIdInput === null) return null;
                payload.studentId = String(studentIdInput || '').trim();
            }
        }

        if (!payload.studentId) return null;

        const tierInput = window.prompt('Tier (tier1/tier2/tier3):', String(payload.tier || 'tier2'));
        if (tierInput === null) return null;
        const normalizedTier = String(tierInput || 'tier2').toLowerCase().replace(/\s+/g, '');
        payload.tier = normalizedTier.startsWith('tier') ? normalizedTier : `tier${normalizedTier || '2'}`;

        const focusInput = window.prompt(
            'Focus areas (comma separated):',
            Array.isArray(payload.focusAreas) ? payload.focusAreas.join(', ') : String(payload.focusAreas || payload.focusArea || '')
        );
        if (focusInput === null) return null;
        payload.focusAreas = String(focusInput || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const goalInput = window.prompt('Primary goal (optional):', String(payload.goal || ''));
        if (goalInput === null) return null;
        payload.goal = String(goalInput || '').trim();

        const notesInput = window.prompt('Notes (optional):', String(payload.notes || ''));
        if (notesInput === null) return null;
        payload.notes = String(notesInput || '').trim();

        return payload;
    }, []);

    const buildProgressPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const assignmentOptions = Array.isArray(payload.assignmentOptions) ? payload.assignmentOptions : [];
        delete payload.assignmentOptions;

        if (!payload.assignmentId) {
            if (assignmentOptions.length > 0) {
                const listText = assignmentOptions
                    .slice(0, 8)
                    .map((assignment, index) => (
                        `${index + 1}. ${assignment.studentName || 'Student'} | ${assignment.tier || 'Tier'} [${assignment.id}]`
                    ))
                    .join('\n');
                const assignmentInput = window.prompt(
                    `Select assignment by number or paste Assignment ID:\n${listText}`,
                    ''
                );
                if (assignmentInput === null) return null;
                const raw = String(assignmentInput || '').trim();
                if (!raw) return null;
                const selectedNumber = Number(raw);
                if (Number.isFinite(selectedNumber) && selectedNumber >= 1 && selectedNumber <= assignmentOptions.length) {
                    payload.assignmentId = String(assignmentOptions[selectedNumber - 1]?.id || '').trim();
                } else {
                    payload.assignmentId = raw;
                }
            } else {
                const assignmentIdInput = window.prompt('Enter Mentor Assignment ID:', '');
                if (assignmentIdInput === null) return null;
                payload.assignmentId = String(assignmentIdInput || '').trim();
            }
        }

        if (!payload.assignmentId) return null;

        const summaryInput = window.prompt('Progress summary (required):', String(payload.summary || 'Progress update'));
        if (summaryInput === null) return null;
        payload.summary = String(summaryInput || '').trim();
        if (!payload.summary) return null;

        const nextStepsInput = window.prompt('Next steps (optional):', String(payload.nextSteps || ''));
        if (nextStepsInput === null) return null;
        payload.nextSteps = String(nextStepsInput || '').trim();

        const valueInput = window.prompt('Progress value (optional number):', payload.value != null ? String(payload.value) : '');
        if (valueInput === null) return null;
        const parsedValue = Number(String(valueInput || '').trim());
        payload.value = Number.isFinite(parsedValue) ? parsedValue : undefined;

        const unitInput = window.prompt('Progress unit (optional):', String(payload.unit || payload.scoreUnit || 'score'));
        if (unitInput === null) return null;
        payload.unit = String(unitInput || '').trim() || 'score';

        const celebrationInput = window.prompt('Celebration note (optional):', String(payload.celebration || ''));
        if (celebrationInput === null) return null;
        payload.celebration = String(celebrationInput || '').trim();

        return payload;
    }, []);

    const buildAssignStudentsPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const studentOptions = Array.isArray(payload.studentOptions) ? payload.studentOptions : [];
        const mentorOptions = Array.isArray(payload.mentorOptions) ? payload.mentorOptions : [];
        const assignmentOptions = Array.isArray(payload.assignmentOptions) ? payload.assignmentOptions : [];
        delete payload.studentOptions;
        delete payload.mentorOptions;
        delete payload.assignmentOptions;

        if (assignmentOptions.length > 0) {
            const assignmentId = resolveSingleSelectionFromPrompt(
                'Optional: choose existing assignment to update (leave blank to create new)',
                assignmentOptions.map((assignment) => ({
                    id: assignment.id,
                    label: `${assignment.studentName || 'Student'} | ${assignment.tier || 'Tier'} | ${assignment.mentorName || 'Mentor'}`
                })),
                'Optional: enter existing assignment ID'
            );
            if (assignmentId) payload.assignmentId = assignmentId;
        }

        const mentorId = resolveSingleSelectionFromPrompt(
            'Select mentor for assignment',
            mentorOptions.map((mentor) => ({
                id: mentor.id,
                label: `${mentor.name || 'Mentor'}${mentor.role ? ` (${mentor.role})` : ''}`
            })),
            'Enter Mentor ID'
        );
        if (!mentorId) return null;
        payload.mentorId = mentorId;

        const studentIds = resolveMultipleSelectionFromPrompt(
            'Select student(s) for MTSS assignment',
            studentOptions.map((student) => ({
                id: student.id,
                label: `${student.name || 'Student'}${student.grade ? ` (${student.grade})` : ''}${student.className ? ` / ${student.className}` : ''}`
            })),
            'Enter comma-separated student IDs'
        );
        if (!studentIds || studentIds.length === 0) return null;
        payload.studentIds = studentIds;

        const tierInput = window.prompt('Tier (tier1/tier2/tier3):', String(payload.tier || 'tier2'));
        if (tierInput === null) return null;
        const normalizedTier = String(tierInput || 'tier2').toLowerCase().replace(/\s+/g, '');
        payload.tier = normalizedTier.startsWith('tier') ? normalizedTier : `tier${normalizedTier || '2'}`;

        const focusInput = window.prompt(
            'Focus areas (comma separated):',
            Array.isArray(payload.focusAreas) ? payload.focusAreas.join(', ') : String(payload.focusAreas || '')
        );
        if (focusInput === null) return null;
        payload.focusAreas = String(focusInput || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const notesInput = window.prompt('Notes (optional):', String(payload.notes || ''));
        if (notesInput === null) return null;
        payload.notes = String(notesInput || '').trim();

        return payload;
    }, [resolveMultipleSelectionFromPrompt, resolveSingleSelectionFromPrompt]);

    const buildAssignInterventionMentorPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const studentOptions = Array.isArray(payload.studentOptions) ? payload.studentOptions : [];
        const mentorOptions = Array.isArray(payload.mentorOptions) ? payload.mentorOptions : [];
        delete payload.studentOptions;
        delete payload.mentorOptions;

        const mentorId = resolveSingleSelectionFromPrompt(
            'Select mentor for intervention mapping',
            mentorOptions.map((mentor) => ({
                id: mentor.id,
                label: `${mentor.name || 'Mentor'}${mentor.role ? ` (${mentor.role})` : ''}`
            })),
            'Enter Mentor ID'
        );
        if (!mentorId) return null;
        payload.mentorId = mentorId;

        const studentIds = resolveMultipleSelectionFromPrompt(
            'Select student(s) to map intervention mentor',
            studentOptions.map((student) => ({
                id: student.id,
                label: `${student.name || 'Student'}${student.grade ? ` (${student.grade})` : ''}`
            })),
            'Enter comma-separated student IDs'
        );
        if (!studentIds || studentIds.length === 0) return null;
        payload.studentIds = studentIds;

        const interventionType = window.prompt(
            'Intervention type (SEL/ENGLISH/MATH/BEHAVIOR/ATTENDANCE):',
            String(payload.interventionType || 'SEL')
        );
        if (interventionType === null) return null;
        payload.interventionType = String(interventionType || 'SEL').trim().toUpperCase();

        const tierInput = window.prompt('Optional tier override (tier1/tier2/tier3):', String(payload.tier || ''));
        if (tierInput === null) return null;
        if (String(tierInput || '').trim()) {
            const normalizedTier = String(tierInput).toLowerCase().replace(/\s+/g, '');
            payload.tier = normalizedTier.startsWith('tier') ? normalizedTier : `tier${normalizedTier}`;
        }

        const notesInput = window.prompt('Notes (optional):', String(payload.notes || ''));
        if (notesInput === null) return null;
        payload.notes = String(notesInput || '').trim();

        return payload;
    }, [resolveMultipleSelectionFromPrompt, resolveSingleSelectionFromPrompt]);

    const buildReassignMentorPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const assignmentOptions = Array.isArray(payload.assignmentOptions) ? payload.assignmentOptions : [];
        const mentorOptions = Array.isArray(payload.mentorOptions) ? payload.mentorOptions : [];
        delete payload.assignmentOptions;
        delete payload.mentorOptions;

        const assignmentId = resolveSingleSelectionFromPrompt(
            'Select assignment to reassign',
            assignmentOptions.map((assignment) => ({
                id: assignment.id,
                label: `${assignment.studentName || 'Student'} | ${assignment.tier || 'Tier'} | ${assignment.mentorName || 'Mentor'}`
            })),
            'Enter Assignment ID'
        );
        if (!assignmentId) return null;
        payload.assignmentId = assignmentId;

        const mentorId = resolveSingleSelectionFromPrompt(
            'Select new mentor',
            mentorOptions.map((mentor) => ({
                id: mentor.id,
                label: `${mentor.name || 'Mentor'}${mentor.role ? ` (${mentor.role})` : ''}`
            })),
            'Enter new Mentor ID'
        );
        if (!mentorId) return null;
        payload.mentorId = mentorId;

        const reasonInput = window.prompt('Reassignment reason (optional):', String(payload.reason || payload.notes || ''));
        if (reasonInput === null) return null;
        payload.reason = String(reasonInput || '').trim();

        return payload;
    }, [resolveSingleSelectionFromPrompt]);

    const buildUpdateAssignmentStatusPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const assignmentOptions = Array.isArray(payload.assignmentOptions) ? payload.assignmentOptions : [];
        delete payload.assignmentOptions;

        const assignmentId = resolveSingleSelectionFromPrompt(
            'Select assignment to update status',
            assignmentOptions.map((assignment) => ({
                id: assignment.id,
                label: `${assignment.studentName || 'Student'} | ${assignment.tier || 'Tier'} | ${assignment.status || 'active'}`
            })),
            'Enter Assignment ID'
        );
        if (!assignmentId) return null;
        payload.assignmentId = assignmentId;

        const statusInput = window.prompt('Status (active/paused/completed/closed):', String(payload.status || 'active'));
        if (statusInput === null) return null;
        payload.status = String(statusInput || 'active').trim().toLowerCase();

        const notesInput = window.prompt('Notes (optional):', String(payload.notes || ''));
        if (notesInput === null) return null;
        payload.notes = String(notesInput || '').trim();

        const summaryInput = window.prompt('Progress summary (optional):', String(payload.summary || ''));
        if (summaryInput === null) return null;
        payload.summary = String(summaryInput || '').trim();

        return payload;
    }, [resolveSingleSelectionFromPrompt]);

    const buildUpdateGoalCompletionPayload = useCallback((seedPayload = {}) => {
        if (typeof window === 'undefined') return null;
        const payload = { ...(seedPayload || {}) };
        const assignmentOptions = Array.isArray(payload.assignmentOptions) ? payload.assignmentOptions : [];
        delete payload.assignmentOptions;

        const assignmentId = resolveSingleSelectionFromPrompt(
            'Select assignment to update goal completion',
            assignmentOptions.map((assignment) => ({
                id: assignment.id,
                label: `${assignment.studentName || 'Student'} | ${assignment.tier || 'Tier'}`
            })),
            'Enter Assignment ID'
        );
        if (!assignmentId) return null;
        payload.assignmentId = assignmentId;

        const goalIndexInput = window.prompt('Goal index (optional, start from 0):', String(payload.goalIndex ?? ''));
        if (goalIndexInput === null) return null;
        const parsedGoalIndex = Number(String(goalIndexInput || '').trim());
        if (Number.isInteger(parsedGoalIndex) && parsedGoalIndex >= 0) {
            payload.goalIndex = parsedGoalIndex;
        }

        if (!Number.isInteger(payload.goalIndex)) {
            const goalTextInput = window.prompt('Goal text (required if goal index is empty):', String(payload.goalText || payload.goal || ''));
            if (goalTextInput === null) return null;
            payload.goalText = String(goalTextInput || '').trim();
            if (!payload.goalText) return null;
        }

        const completedInput = window.prompt('Mark as completed? (yes/no):', payload.completed === false ? 'no' : 'yes');
        if (completedInput === null) return null;
        payload.completed = !/^(no|n|false|0)$/i.test(String(completedInput || '').trim());

        const summaryInput = window.prompt('Summary note (optional):', String(payload.summary || ''));
        if (summaryInput === null) return null;
        payload.summary = String(summaryInput || '').trim();

        return payload;
    }, [resolveSingleSelectionFromPrompt]);

    const handleExecuteOperation = useCallback(async (action = {}) => {
        const operation = String(action.operation || '').trim().toLowerCase();
        if (!operation) return;

        if (!canExecuteAutomation) {
            toast({
                title: 'Automation unavailable',
                description: 'This execute_operation is only available for authorized MTSS roles.',
                variant: 'destructive'
            });
            return;
        }

        if (action.requireConfirmation !== false) {
            const confirmed = window.confirm(String(action.confirmText || 'Run this automation now?'));
            if (!confirmed) return;
        }

        const payloadBuilders = {
            create_mtss_intervention: buildCreateInterventionPayload,
            append_mtss_progress_checkin: buildProgressPayload,
            assign_students_to_mtss_mentor: buildAssignStudentsPayload,
            assign_intervention_mentor: buildAssignInterventionMentorPayload,
            reassign_mtss_assignment_mentor: buildReassignMentorPayload,
            update_mtss_assignment_status: buildUpdateAssignmentStatusPayload,
            update_mtss_goal_completion: buildUpdateGoalCompletionPayload
        };

        const builder = payloadBuilders[operation];
        if (!builder) {
            toast({
                title: 'Unsupported automation',
                description: `Operation "${operation}" is not supported on this client.`,
                variant: 'destructive'
            });
            return;
        }

        const payload = builder(action.payload || {});
        if (!payload) return;

        try {
            const result = await aiChatService.executeAssistantOperation(operation, payload, sessionId);
            dispatch(setBuddyAnimation('celebrate'));
            toast({
                title: 'Automation completed',
                description: String(action.successMessage || result?.message || 'Operation executed successfully.')
            });
            if (sessionId) {
                dispatch(loadConversationHistory({ sessionId, limit: 120 }));
            }
            scheduleConversationsRefresh(false);
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || action.failureMessage || 'Automation failed.';
            toast({
                title: 'Automation failed',
                description: String(message),
                variant: 'destructive'
            });
        }
    }, [
        buildAssignInterventionMentorPayload,
        buildAssignStudentsPayload,
        buildCreateInterventionPayload,
        buildProgressPayload,
        buildReassignMentorPayload,
        buildUpdateAssignmentStatusPayload,
        buildUpdateGoalCompletionPayload,
        canExecuteAutomation,
        dispatch,
        scheduleConversationsRefresh,
        sessionId,
        toast
    ]);

    const handleWidgetAction = useCallback((action) => {
        if (!action || typeof action !== 'object') return;
        const type = String(action.type || '').trim().toLowerCase();

        if (type === 'navigate') {
            handleClientAction({
                ...action,
                type: 'navigate'
            });
            return;
        }

        if (type === 'prefill') {
            const value = String(action.value || action.message || '').trim();
            if (!value) return;
            setLocalInputValue(value);
            inputRef.current?.focus();
            return;
        }

        if (type === 'execute_operation') {
            handleExecuteOperation(action);
        }
    }, [handleClientAction, handleExecuteOperation]);

    const clearThemeCommandTimeouts = useCallback(() => {
        themeCommandTimeoutsRef.current.forEach((timerId) => window.clearTimeout(timerId));
        themeCommandTimeoutsRef.current = [];
    }, []);

    const queueThemeCommandTimeout = useCallback((callback, delayMs) => {
        const timerId = window.setTimeout(() => {
            themeCommandTimeoutsRef.current = themeCommandTimeoutsRef.current.filter((id) => id !== timerId);
            callback();
        }, delayMs);
        themeCommandTimeoutsRef.current.push(timerId);
        return timerId;
    }, []);

    const getThemeSpellOrigin = useCallback(() => {
        const buttonEl = sendButtonRef.current;
        if (buttonEl && typeof buttonEl.getBoundingClientRect === 'function') {
            const rect = buttonEl.getBoundingClientRect();
            return {
                x: rect.left + (rect.width / 2),
                y: rect.top + (rect.height / 2)
            };
        }
        if (typeof window !== 'undefined') {
            return {
                x: window.innerWidth * 0.82,
                y: window.innerHeight * 0.86
            };
        }
        return { x: null, y: null };
    }, []);

    const handleThemeCommandIntent = useCallback((userMessage, themeIntent) => {
        clearThemeCommandTimeouts();

        const assistantReply = buildThemeCommandReply({
            themeIntent,
            assistantName,
            isStudentRole,
            studentCallName,
            seed: userMessage
        });

        dispatch(setTyping(true));
        dispatch(setBuddyAnimation('nod'));

        queueThemeCommandTimeout(() => {
            dispatch(addAIMessage({ content: assistantReply, widgets: [] }));
            dispatch(setBuddyAnimation('wave'));

            queueThemeCommandTimeout(() => {
                applyThemePreference(themeIntent.targetTheme);
                persistTheme(themeIntent.targetTheme);

                const origin = getThemeSpellOrigin();
                emitThemeSpell({
                    theme: themeIntent.targetTheme,
                    x: origin.x,
                    y: origin.y,
                    trigger: 'assistant-chat-theme-command'
                });
            }, THEME_COMMAND_APPLY_DELAY_MS);
        }, THEME_COMMAND_TYPING_DELAY_MS);
    }, [
        assistantName,
        clearThemeCommandTimeouts,
        dispatch,
        getThemeSpellOrigin,
        isStudentRole,
        queueThemeCommandTimeout,
        studentCallName
    ]);

    const dismissCoachNudge = useCallback((withSnooze = false) => {
        setIsCoachVisible(false);
        lastInteractionAtRef.current = Date.now();

        if (!withSnooze) return;

        const persisted = normalizeCoachState(readCoachState(coachStateUserKey));
        writeCoachState(coachStateUserKey, {
            ...persisted,
            snoozeUntil: Date.now() + CHAT_COACH_SNOOZE_MS
        });
    }, [coachStateUserKey]);

    const applyCoachNudge = useCallback(() => {
        if (!coachNudge?.suggestion) return;
        setLocalInputValue(coachNudge.suggestion);
        setIsCoachVisible(false);
        lastInteractionAtRef.current = Date.now();
        inputRef.current?.focus();
    }, [coachNudge]);

    const dispatchChatMessage = useCallback((rawMessage) => {
        const userMessage = String(rawMessage || '').trim();
        if (!userMessage || isLoading) return;

        setAutoScrollEnabled(true);
        setManualVisibleCount(CHAT_MESSAGE_WINDOW_SIZE);
        setIsCoachVisible(false);
        lastInteractionAtRef.current = Date.now();
        setLocalInputValue('');
        dispatch(addUserMessage(userMessage));

        const themeIntent = detectAssistantThemeIntent(userMessage, getCurrentTheme());
        if (themeIntent?.autoApply) {
            handleThemeCommandIntent(userMessage, themeIntent);
            return;
        }

        dispatch(sendMessage({ message: userMessage, sessionId }))
            .unwrap()
            .then((payload) => {
                scheduleConversationsRefresh(false);
                const navigatedByServerAction = handleClientAction(payload?.clientAction);

                if (!navigatedByServerAction) {
                    const localAction = detectAssistantNavigationIntent(userMessage, normalizedRole);
                    if (localAction) {
                        handleClientAction(localAction);
                    }
                }
            })
            .catch(() => { });
    }, [
        dispatch,
        handleClientAction,
        handleThemeCommandIntent,
        isLoading,
        normalizedRole,
        scheduleConversationsRefresh,
        sessionId
    ]);

    useEffect(() => {
        const routeState = location.state || {};
        const dockNonce = routeState.dockNonce;
        const prefillMessage = String(routeState.prefillMessage || '').trim();
        const autoSendFromDock = Boolean(routeState.autoSendFromDock);

        if (!dockNonce || processedDockNonceRef.current === dockNonce) {
            return;
        }
        processedDockNonceRef.current = dockNonce;

        if (prefillMessage) {
            if (autoSendFromDock && !isLoading) {
                dispatchChatMessage(prefillMessage);
            } else {
                setLocalInputValue(prefillMessage);
                inputRef.current?.focus();
            }
        }

        const restState = { ...routeState };
        delete restState.prefillMessage;
        delete restState.autoSendFromDock;
        delete restState.dockNonce;
        const nextState = Object.keys(restState).length > 0 ? restState : null;
        navigate(location.pathname, { replace: true, state: nextState });
    }, [dispatchChatMessage, isLoading, location.pathname, location.state, navigate]);

    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        dispatchChatMessage(inputValue);
    }, [dispatchChatMessage, inputValue]);

    const handleInputChange = useCallback((e) => {
        lastInteractionAtRef.current = Date.now();
        if (isCoachVisible) {
            setIsCoachVisible(false);
        }
        setLocalInputValue(e.target.value);

        // Trigger buddy animation on typing
        if (e.target.value && !buddyAnimation) {
            dispatch(setBuddyAnimation('pulse'));
        }
    }, [dispatch, buddyAnimation, isCoachVisible]);

    const handleToggleSound = useCallback(() => {
        dispatch(toggleSound());
    }, [dispatch]);

    const handleOpenConversation = useCallback((targetSessionId) => {
        if (!targetSessionId || historyLoading) return;
        setAutoScrollEnabled(true);
        setManualVisibleCount(CHAT_MESSAGE_WINDOW_SIZE);
        setIsCoachVisible(false);
        setCoachNudge(null);
        lastInteractionAtRef.current = Date.now();
        sessionCoachCountRef.current = 0;
        dispatch(loadConversationHistory({ sessionId: targetSessionId, limit: 120 }));
        setIsHistoryOpen(false);
    }, [dispatch, historyLoading]);

    const handleLoadOlderMessages = useCallback(() => {
        const element = messagesScrollRef.current;
        const previousScrollTop = element?.scrollTop || 0;
        const previousScrollHeight = element?.scrollHeight || 0;

        setAutoScrollEnabled(false);
        setManualVisibleCount((prev) => prev + CHAT_MESSAGE_WINDOW_STEP);

        requestAnimationFrame(() => {
            const nextElement = messagesScrollRef.current;
            if (!nextElement) return;
            const scrollHeightDelta = nextElement.scrollHeight - previousScrollHeight;
            nextElement.scrollTop = Math.max(0, previousScrollTop + scrollHeightDelta);
        });
    }, []);

    const handleMessagesScroll = useCallback(() => {
        const nearBottom = checkNearBottom();
        setAutoScrollEnabled((prev) => (prev === nearBottom ? prev : nearBottom));
        if (nearBottom) {
            setManualVisibleCount((prev) => (prev === CHAT_MESSAGE_WINDOW_SIZE ? prev : CHAT_MESSAGE_WINDOW_SIZE));
        }
    }, [checkNearBottom]);

    const rafMessagesScrollHandler = useRafThrottle(handleMessagesScroll);

    useEffect(() => {
        const element = messagesScrollRef.current;
        if (!element) return;

        element.addEventListener('scroll', rafMessagesScrollHandler, { passive: true });
        return () => {
            element.removeEventListener('scroll', rafMessagesScrollHandler);
        };
    }, [rafMessagesScrollHandler]);

    const formatConversationTime = useCallback((value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '';
        const now = new Date();
        const isSameDay = parsed.toDateString() === now.toDateString();
        return isSameDay
            ? parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }, []);

    const openNicknameEditor = useCallback(() => {
        setNicknameDraft(assistantName);
        setIsNicknameEditorOpen(true);
    }, [assistantName]);

    const closeNicknameEditor = useCallback(() => {
        if (assistantSaving) return;
        setIsNicknameEditorOpen(false);
        setNicknameDraft(assistantName);
    }, [assistantName, assistantSaving]);

    const handleNicknameSubmit = useCallback(async (event) => {
        event.preventDefault();
        const trimmed = String(nicknameDraft || '').trim();

        if (!trimmed) {
            toast({
                title: "Nickname can't be empty",
                description: "Please enter a nickname for your AI Assistant.",
                variant: "destructive"
            });
            return;
        }

        if (trimmed.length < 2 || trimmed.length > 24) {
            toast({
                title: "Nickname length is invalid",
                description: "Use 2 to 24 characters for the nickname.",
                variant: "destructive"
            });
            return;
        }

        if (!/^[A-Za-z0-9 _-]+$/.test(trimmed)) {
            toast({
                title: "Invalid nickname format",
                description: "Use letters, numbers, spaces, hyphen, or underscore.",
                variant: "destructive"
            });
            return;
        }

        if (trimmed === assistantName) {
            setIsNicknameEditorOpen(false);
            return;
        }

        try {
            await dispatch(saveAssistantProfile({ assistantName: trimmed })).unwrap();
            setIsNicknameEditorOpen(false);
            dispatch(setBuddyAnimation('celebrate'));
            toast({
                title: "Nickname updated",
                description: `Your AI Assistant nickname is now ${trimmed}.`
            });
        } catch (error) {
            toast({
                title: "Failed to update nickname",
                description: error || 'Please try again.',
                variant: "destructive"
            });
        }
    }, [assistantName, dispatch, nicknameDraft, toast]);

    const defaultRoleSuggestions = useMemo(() => {
        if (isStudentRole) {
            return [
                'Help me make a study plan for today',
                'Explain this topic step by step',
                'Quiz me in 5 quick questions',
                'Check my MTSS progress'
            ];
        }

        if (isPrincipalRole || isLeadershipRole) {
            return [
                'Create an executive MTSS brief for today',
                'Rank unit risks and assign owner + due date',
                'Recommend mentor workload rebalance for this week',
                'Summarize overdue check-ins and escalation actions'
            ];
        }

        if (isTeacherRole) {
            return [
                'Analyze my MTSS students and rank today priorities',
                'Draft a progress check-in note I can paste now',
                'Create an intervention plan with baseline and target',
                'Draft a parent-friendly support update'
            ];
        }

        return [
            'Help me make a practical work plan for today',
            'Summarize my top priorities and next actions',
            'Prepare a concise dashboard update',
            'Show my current MTSS task status'
        ];
    }, [isLeadershipRole, isPrincipalRole, isStudentRole, isTeacherRole]);

    // Quick suggestions
    const quickSuggestions = useMemo(() => [
        ...dailyQuickActions,
        ...defaultRoleSuggestions
    ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 6), [dailyQuickActions, defaultRoleSuggestions]);

    const quickSuggestionStyles = useMemo(() => ([
        'bg-gradient-to-r from-cyan-300/80 to-sky-200/85 text-sky-950',
        'bg-gradient-to-r from-pink-300/80 to-rose-200/85 text-rose-950',
        'bg-gradient-to-r from-lime-300/80 to-emerald-200/85 text-emerald-950',
        'bg-gradient-to-r from-amber-300/80 to-orange-200/85 text-orange-950',
        'bg-gradient-to-r from-indigo-300/80 to-violet-200/85 text-violet-950',
        'bg-gradient-to-r from-fuchsia-300/80 to-pink-200/85 text-fuchsia-950'
    ]), []);

    const twinRiskBadgeClass = useMemo(() => {
        if (twinRiskLevel === 'high') return 'from-rose-100/90 to-red-100/85 dark:from-rose-500/20 dark:to-red-500/20 border-rose-200/55 dark:border-rose-300/25 text-rose-700 dark:text-rose-200';
        if (twinRiskLevel === 'medium') return 'from-amber-100/90 to-orange-100/85 dark:from-amber-500/20 dark:to-orange-500/20 border-amber-200/55 dark:border-amber-300/25 text-amber-700 dark:text-amber-200';
        return 'from-emerald-100/90 to-lime-100/85 dark:from-emerald-500/20 dark:to-lime-500/20 border-emerald-200/55 dark:border-emerald-300/25 text-emerald-700 dark:text-emerald-200';
    }, [twinRiskLevel]);

    return (
        <div className="chat-bg chat-font student-shell h-[100dvh] min-h-screen relative overflow-x-hidden" data-student-theme="chat">
            {/* Background grid */}
            <div className="chat-grid absolute inset-0 pointer-events-none" />

            {/* Animated blobs */}
            <div className="absolute -top-20 -right-16 w-80 sm:w-[430px] h-80 sm:h-[430px] rounded-full blur-3xl bg-gradient-to-br from-cyan-300/40 via-sky-300/30 to-transparent dark:from-cyan-400/15 dark:via-sky-500/10 dark:to-transparent pointer-events-none" style={{ animation: 'chatBlob 12s ease-in-out infinite' }} />
            <div className="absolute -bottom-24 -left-20 w-72 sm:w-[390px] h-72 sm:h-[390px] rounded-full blur-3xl bg-gradient-to-tr from-amber-300/35 via-pink-300/30 to-transparent dark:from-amber-400/12 dark:via-pink-500/10 dark:to-transparent pointer-events-none" style={{ animation: 'chatBlob 15s ease-in-out infinite reverse' }} />
            <div className="absolute top-1/3 -left-16 w-60 sm:w-72 h-60 sm:h-72 rounded-full blur-3xl bg-gradient-to-br from-lime-300/28 via-emerald-200/25 to-transparent dark:from-lime-400/10 dark:via-emerald-400/8 dark:to-transparent pointer-events-none" style={{ animation: 'chatBlob 18s ease-in-out infinite' }} />

            {/* Floating particles */}
            {particles.map((particle, i) => (
                <ChatParticle key={i} {...particle} />
            ))}

            {/* Conversation history drawer */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Close history"
                            onClick={() => setIsHistoryOpen(false)}
                            className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.aside
                            initial={{ x: -380, opacity: 0.4 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -380, opacity: 0.4 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 z-40 w-[320px] sm:w-[360px] bg-[linear-gradient(160deg,_rgb(8_24_46/0.94),_rgb(26_37_68/0.92),_rgb(40_20_52/0.9))] border-r border-cyan-200/20 backdrop-blur-xl shadow-2xl p-3 sm:p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-white">
                                    <History className="w-4 h-4 text-cyan-300" />
                                    <h3 className="text-sm font-semibold tracking-wide">Your Chats</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsHistoryOpen(false)}
                                    className="p-1.5 rounded-lg bg-white/12 hover:bg-cyan-300/20 text-white transition-all"
                                >
                                    <PanelLeftClose className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="h-[calc(100%-3rem)] overflow-y-auto pr-1 space-y-2">
                                {conversationsLoading ? (
                                    Array.from({ length: 6 }).map((_, idx) => (
                                        <div key={`conv-skeleton-${idx}`} className="h-16 rounded-xl bg-white/10 animate-pulse" />
                                    ))
                                ) : conversations.length === 0 ? (
                                    <div className="rounded-xl border border-cyan-200/25 bg-cyan-200/10 p-3 text-sm text-slate-200">
                                        No chat history yet. Start your first conversation.
                                    </div>
                                ) : (
                                    conversations.map((conversation, index) => {
                                        const isActive = sessionId === conversation.sessionId;
                                        const isArchived = conversation.status === 'archived';
                                        const hasMemorySummary = Boolean(conversation.hasMemorySummary);
                                        const title = conversation.title || 'New Conversation';
                                        const preview = conversation.preview || 'Open this chat to continue the context.';
                                        const badge = ['✨', '🧠', '🎯', '📘', '🌟'][index % 5];

                                        return (
                                            <motion.button
                                                key={conversation.sessionId}
                                                type="button"
                                                whileHover={{ scale: 1.01, x: 2 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleOpenConversation(conversation.sessionId)}
                                                className={`w-full text-left rounded-xl px-3 py-2.5 border transition-all ${isActive
                                                        ? 'bg-gradient-to-r from-cyan-400/28 via-indigo-400/16 to-pink-400/16 border-cyan-300/45 text-white'
                                                        : 'bg-white/6 border-white/12 text-slate-100 hover:bg-cyan-300/12'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="text-sm font-semibold truncate">
                                                        <span className="mr-1.5">{badge}</span>{title}
                                                    </p>
                                                    <span className="text-[11px] text-slate-300 shrink-0 inline-flex items-center gap-1">
                                                        <Clock3 className="w-3 h-3" />
                                                        {formatConversationTime(conversation.lastActivity)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-300/90 line-clamp-2">{preview}</p>
                                                <div className="mt-1.5 text-[11px] text-slate-300/90">
                                                    {conversation.messageCount || 0} messages
                                                    {isArchived ? ' • archived' : isActive ? ' • active' : ''}
                                                    {hasMemorySummary ? ' • memory on' : ''}
                                                </div>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="relative z-10 h-full min-h-0 flex flex-col">
                {/* Header with AI Buddy */}
                <div className="p-4 sm:p-6">
                    <div className="max-w-3xl mx-auto">
                        <AnimatePresence>
                            {isNicknameEditorOpen && (
                                <motion.form
                                    onSubmit={handleNicknameSubmit}
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="mb-3 rounded-2xl p-3 sm:p-4 chat-soft-panel backdrop-blur-md shadow-sm"
                                >
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        <Sparkles className="w-4 h-4 text-cyan-500" />
                                        <span>Set your personal AI nickname (example: Jarvis)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={nicknameInputRef}
                                            type="text"
                                            value={nicknameDraft}
                                            onChange={(event) => setNicknameDraft(event.target.value)}
                                            disabled={assistantSaving}
                                            maxLength={24}
                                            className="flex-1 px-3 py-2 rounded-xl bg-white/90 dark:bg-white/10 border border-cyan-200/45 dark:border-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-300 text-sm text-gray-800 dark:text-white"
                                            placeholder="Enter assistant nickname..."
                                        />
                                        <motion.button
                                            type="submit"
                                            disabled={assistantSaving}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-3 py-2 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-pink-500 text-white disabled:opacity-60"
                                        >
                                            {assistantSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </motion.button>
                                        <motion.button
                                            type="button"
                                            onClick={closeNicknameEditor}
                                            disabled={assistantSaving}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-3 py-2 rounded-xl bg-white/80 dark:bg-white/10 border border-cyan-200/45 dark:border-cyan-200/20 text-gray-700 dark:text-gray-300 disabled:opacity-60"
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Live preview: Call me <span className="font-semibold text-cyan-600 dark:text-cyan-300">{displayedAssistantName}</span>
                                    </p>
                                </motion.form>
                            )}
                        </AnimatePresence>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {/* AI Buddy Character */}
                                <div className="relative p-1.5 rounded-2xl chat-soft-panel">
                                    <AIBuddy expression={buddyExpression} animation={buddyAnimation} />
                                </div>

                                <div>
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 dark:from-cyan-300 dark:via-indigo-200 dark:to-pink-300">
                                        AI Assistant
                                    </h1>
                                    <p className="text-sm text-slate-700 dark:text-slate-200">
                                        {isTyping
                                            ? `${displayedAssistantName} is typing...`
                                            : historyLoading
                                                ? 'Loading conversation context...'
                                                : assistantLoading
                                                    ? 'Preparing your personal assistant...'
                                                    : `Call me ${displayedAssistantName}. Your personal AI assistant for ${assistantSupportTagline}`}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={openNicknameEditor}
                                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-100/85 to-pink-100/85 dark:from-cyan-400/15 dark:to-pink-400/15 backdrop-blur-sm border border-cyan-200/45 dark:border-cyan-200/20 text-gray-700 dark:text-gray-200 hover:brightness-105 transition-all"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                                            <span>Nickname: {assistantName}</span>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-gradient-to-r border backdrop-blur-sm ${twinRiskBadgeClass}`}>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Twin: {twinRiskLevel} risk • {twinConfidencePct}% confidence
                                        </span>
                                        {/* <span className="chat-pill-glow inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-gradient-to-r from-lime-100/85 to-emerald-100/80 dark:from-lime-400/18 dark:to-emerald-400/16 border border-lime-200/50 dark:border-lime-200/20 text-emerald-700 dark:text-emerald-200">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Cheer Mode
                                        </span> */}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* History toggle */}
                                <button
                                    onClick={() => setIsHistoryOpen((prev) => !prev)}
                                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-100/85 to-sky-100/80 dark:from-cyan-400/15 dark:to-sky-400/15 backdrop-blur-sm border border-cyan-200/45 dark:border-cyan-200/20 hover:brightness-105 transition-all"
                                    title="Open chat history"
                                >
                                    {isHistoryOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                                </button>

                                {/* Sound toggle */}
                                <button
                                    onClick={handleToggleSound}
                                    className="p-2 rounded-xl bg-gradient-to-r from-lime-100/85 to-emerald-100/80 dark:from-lime-400/15 dark:to-emerald-400/15 backdrop-blur-sm border border-lime-200/45 dark:border-lime-200/20 hover:brightness-105 transition-all"
                                    title={soundEnabled ? "Mute sound" : "Enable sound"}
                                >
                                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>

                                {/* New chat button */}
                                <button
                                    onClick={handleStartNewChat}
                                    className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-pink-100/85 to-amber-100/85 dark:from-pink-400/15 dark:to-amber-400/15 backdrop-blur-sm border border-pink-200/45 dark:border-pink-200/20 hover:brightness-105 transition-all flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages container */}
                <div
                    ref={messagesScrollRef}
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4"
                >
                    <div className="max-w-3xl mx-auto space-y-4">
                        {messages.length === 0 ? (
                            // Welcome message
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12 sm:py-20"
                            >
                                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
                                    <AIBuddy expression={buddyExpression} animation="wave" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 dark:from-cyan-300 dark:via-violet-200 dark:to-pink-300 mb-2 sm:mb-3">
                                    Hi! I&apos;m your AI Assistant. You can call me {displayedAssistantName}. 👋
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                                    {assistantWelcomeSubtitle}
                                </p>

                                {dailyFocus.length > 0 && (
                                    <div className="mb-6 max-w-xl mx-auto text-left px-4">
                                        <div className="rounded-2xl px-4 py-3 chat-soft-panel backdrop-blur-sm">
                                            <p className="text-xs uppercase tracking-wide text-cyan-700 dark:text-cyan-300 mb-2 font-semibold">Today&apos;s Focus</p>
                                            <ul className="space-y-1">
                                                {dailyFocus.slice(0, 3).map((focus, idx) => (
                                                    <li key={`${focus}-${idx}`} className="text-sm text-gray-700 dark:text-gray-200">• {focus}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Quick suggestions */}
                                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto px-4">
                                    {quickSuggestions.map((suggestion, i) => (
                                        <motion.button
                                            key={i}
                                            onClick={() => {
                                                setLocalInputValue(suggestion);
                                                inputRef.current?.focus();
                                            }}
                                            className={`chat-action-chip px-3 py-2 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm transition-all text-sm font-semibold ${quickSuggestionStyles[i % quickSuggestionStyles.length]} dark:text-slate-100`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {suggestion}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            // Messages list
                            <MessageStream
                                canLoadOlderMessages={canLoadOlderMessages}
                                hiddenMessageCount={hiddenMessageCount}
                                onLoadOlderMessages={handleLoadOlderMessages}
                                messageWindowStep={CHAT_MESSAGE_WINDOW_STEP}
                                renderedMessages={renderedMessages}
                                visibleStartIndex={visibleStartIndex}
                                isTyping={isTyping}
                                onWidgetAction={handleWidgetAction}
                            />
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isCoachVisible && coachNudge && messages.length > 0 && !isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pb-2"
                        >
                            <div className="max-w-3xl mx-auto">
                                <div className="rounded-2xl border border-cyan-200/55 dark:border-cyan-200/20 bg-gradient-to-r from-white/92 via-cyan-50/88 to-pink-50/88 dark:from-slate-900/76 dark:via-cyan-500/10 dark:to-pink-500/10 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3 shadow-[0_12px_28px_rgba(6,182,212,0.14)]">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300">{coachNudge.title}</p>
                                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-100 mt-0.5">{coachNudge.text}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => dismissCoachNudge(false)}
                                            className="p-1 rounded-md text-slate-600 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                            aria-label="Dismiss coach suggestion"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={applyCoachNudge}
                                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:brightness-105 transition-all"
                                        >
                                            Use this prompt
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => dismissCoachNudge(true)}
                                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white/95 dark:bg-slate-800/90 border border-slate-300/85 dark:border-slate-400/45 hover:brightness-105 transition-all"
                                        >
                                            Snooze
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input area */}
                <div className="shrink-0 p-4 border-t border-cyan-200/35 dark:border-cyan-200/15 bg-white/35 dark:bg-black/25 backdrop-blur-md">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="Type a message..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-cyan-200/50 dark:border-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-300 disabled:opacity-50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base transition-all"
                            />
                            <motion.button
                                ref={sendButtonRef}
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                data-ai-theme-spell-origin="chat-send"
                                className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-pink-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                                whileHover={{ scale: !isLoading && inputValue.trim() ? 1.05 : 1 }}
                                whileTap={{ scale: !isLoading && inputValue.trim() ? 0.95 : 1 }}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </motion.button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
