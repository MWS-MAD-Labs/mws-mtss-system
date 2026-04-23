import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, MessageCircle, Plus, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useDispatch, useSelector } from 'react-redux';
import {
    sendMessage,
    loadConversations,
    startNewConversation,
    addUserMessage,
    setInputValue,
    setBuddyAnimation,
    resetBuddyToIdle,
    toggleSound,
    selectMessages,
    selectSessionId,
    selectIsLoading,
    selectIsTyping,
    selectInputValue,
    selectBuddyExpression,
    selectBuddyAnimation,
    selectSoundEnabled
} from '@/store/slices/aiChatSlice';

// Scoped styles for chat page (Hub-style design + animations)
const ChatScopedStyles = () => (
    <style>{`
        .chat-bg {
            background: linear-gradient(135deg,
                rgb(255 251 235 / 0.5) 0%,
                rgb(254 242 242 / 0.5) 33%,
                rgb(250 245 255 / 0.5) 66%,
                rgb(239 246 255 / 0.5) 100%
            );
        }
        .dark .chat-bg {
            background: linear-gradient(135deg,
                hsl(var(--background)) 0%,
                hsl(var(--background)) 100%
            );
        }

        .chat-grid {
            background-image:
                linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
            background-size: 24px 24px;
        }
        .dark .chat-grid {
            background-image:
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        }

        .chat-font {
            font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: -0.011em;
        }

        /* Blob animations */
        @keyframes chatBlob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(10px, -20px) scale(1.05); }
            50% { transform: translate(-15px, 10px) scale(0.95); }
            75% { transform: translate(15px, 15px) scale(1.02); }
        }

        /* AI Buddy animations */
        @keyframes buddyBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-12px) scale(1.1); }
        }

        @keyframes buddyWave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            75% { transform: rotate(-15deg); }
        }

        @keyframes buddyNod {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
        }

        @keyframes buddyCelebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1.3) rotate(10deg); }
            75% { transform: scale(1.2) rotate(-10deg); }
        }

        @keyframes buddyPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.8; }
        }

        .buddy-bounce { animation: buddyBounce 0.6s ease-in-out; }
        .buddy-wave { animation: buddyWave 1s ease-in-out; }
        .buddy-nod { animation: buddyNod 0.5s ease-in-out infinite; }
        .buddy-celebrate { animation: buddyCelebrate 0.8s ease-in-out; }
        .buddy-pulse { animation: buddyPulse 1.5s ease-in-out infinite; }

        /* Message animations */
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px) scale(0.9); }
            to { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px) scale(0.9); }
            to { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes messageReaction {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .message-user {
            animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .message-assistant {
            animation: slideInLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .message-reaction {
            animation: messageReaction 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Typing indicator */
        @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-12px); opacity: 1; }
        }

        .typing-dot {
            animation: typingDot 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        /* Sparkle effect */
        @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }

        .sparkle {
            animation: sparkle 1.5s ease-in-out infinite;
        }

        /* Quick reaction buttons */
        @keyframes reactionPop {
            0% { transform: scale(0); }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .reaction-button {
            animation: reactionPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Message bubble hover effect */
        .message-bubble {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .message-bubble:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        /* Particle burst effect */
        @keyframes particleBurst {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        .particle {
            animation: particleBurst 0.8s ease-out forwards;
        }
    `}</style>
);

// Particle decorations (Hub-style)
const ChatParticle = React.memo(({ delay = 0, size = 'sm', type = 'dot', top = '20%', left = '10%' }) => {
    const sizeClasses = {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    const shapes = {
        dot: 'rounded-full bg-violet-400/20 dark:bg-violet-400/10',
        ring: 'rounded-full border-2 border-fuchsia-400/20 dark:border-fuchsia-400/10',
        cross: 'rotate-45 bg-gradient-to-br from-rose-400/15 to-transparent dark:from-rose-400/8 dark:to-transparent',
        diamond: 'rotate-45 bg-amber-400/15 dark:bg-amber-400/8'
    };

    return (
        <motion.div
            className={`absolute ${sizeClasses[size]} ${shapes[type]} pointer-events-none`}
            style={{ top, left }}
            animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1]
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

// Message Bubble Component
const MessageBubble = React.memo(({ message, isUser }) => {
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState(null);

    const reactions = ['👍', '❤️', '😂', '🤔', '🎉'];

    const handleReaction = useCallback((reaction) => {
        setSelectedReaction(reaction);
        setShowReactions(false);
        // Could dispatch action to save reaction
    }, []);

    return (
        <div className={`relative group`}>
            <div
                className={`message-bubble rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-4 ${
                    isUser
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                        : 'bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-800 dark:text-gray-100'
                }`}
                onMouseEnter={() => !isUser && setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
            >
                <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {message.content}
                </p>

                {/* Quick reactions */}
                {!isUser && showReactions && (
                    <div className="absolute -bottom-8 left-0 flex gap-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-lg border border-gray-200/50 dark:border-white/10">
                        {reactions.map((reaction, i) => (
                            <button
                                key={reaction}
                                onClick={() => handleReaction(reaction)}
                                className="reaction-button hover:scale-125 transition-transform text-lg"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                {reaction}
                            </button>
                        ))}
                    </div>
                )}

                {/* Selected reaction */}
                {selectedReaction && (
                    <div className="absolute -top-3 -right-3 message-reaction text-2xl">
                        {selectedReaction}
                    </div>
                )}
            </div>
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';

// Main component
export default function StudentAIChatPage() {
    const dispatch = useDispatch();
    const { toast } = useToast();

    // Redux state
    const messages = useSelector(selectMessages);
    const sessionId = useSelector(selectSessionId);
    const isLoading = useSelector(selectIsLoading);
    const isTyping = useSelector(selectIsTyping);
    const inputValue = useSelector(selectInputValue);
    const buddyExpression = useSelector(selectBuddyExpression);
    const buddyAnimation = useSelector(selectBuddyAnimation);
    const soundEnabled = useSelector(selectSoundEnabled);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load conversations on mount
    useEffect(() => {
        dispatch(loadConversations());
    }, [dispatch]);

    // Reset buddy animation after it completes
    useEffect(() => {
        if (buddyAnimation && buddyAnimation !== 'idle' && buddyAnimation !== 'pulse') {
            const timer = setTimeout(() => {
                dispatch(resetBuddyToIdle());
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [buddyAnimation, dispatch]);

    // Handlers (memoized for performance)
    const handleStartNewChat = useCallback(() => {
        dispatch(startNewConversation())
            .unwrap()
            .then(() => {
                toast({
                    title: "Chat baru dimulai! 🎉",
                    description: "Mulai ngobrol dengan AI Study Buddy kamu"
                });
            })
            .catch(() => {
                toast({
                    title: "Gagal memulai chat baru",
                    description: "Coba lagi ya!",
                    variant: "destructive"
                });
            });
    }, [dispatch, toast]);

    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();

        // Optimistic update
        dispatch(addUserMessage(userMessage));

        // Send to API
        dispatch(sendMessage({ message: userMessage, sessionId }));
    }, [inputValue, isLoading, sessionId, dispatch]);

    const handleInputChange = useCallback((e) => {
        dispatch(setInputValue(e.target.value));

        // Trigger buddy animation on typing
        if (e.target.value && !buddyAnimation) {
            dispatch(setBuddyAnimation('pulse'));
        }
    }, [dispatch, buddyAnimation]);

    const handleToggleSound = useCallback(() => {
        dispatch(toggleSound());
    }, [dispatch]);

    // Quick suggestions
    const quickSuggestions = useMemo(() => [
        '🔢 Bantuin PR Math',
        '📚 Jelasin materi',
        '✨ Motivasi dong!',
        '🎯 Tips belajar'
    ], []);

    return (
        <div className="chat-bg chat-font min-h-screen relative overflow-hidden">
            <ChatScopedStyles />

            {/* Background grid */}
            <div className="chat-grid absolute inset-0 pointer-events-none" />

            {/* Animated blobs */}
            <div className="absolute -top-20 -right-16 w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full blur-3xl bg-gradient-to-br from-violet-200/40 via-fuchsia-200/30 to-purple-100/20 dark:from-violet-500/8 dark:via-fuchsia-500/4 dark:to-transparent pointer-events-none" style={{ animation: 'chatBlob 12s ease-in-out infinite' }} />
            <div className="absolute -bottom-24 -left-20 w-72 sm:w-[380px] h-72 sm:h-[380px] rounded-full blur-3xl bg-gradient-to-tr from-rose-200/40 via-pink-200/30 to-red-100/20 dark:from-rose-500/6 dark:via-pink-500/3 dark:to-transparent pointer-events-none" style={{ animation: 'chatBlob 15s ease-in-out infinite reverse' }} />

            {/* Floating particles */}
            {particles.map((particle, i) => (
                <ChatParticle key={i} {...particle} />
            ))}

            {/* Main content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header with AI Buddy */}
                <div className="p-4 sm:p-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {/* AI Buddy Character */}
                                <div className="relative">
                                    <AIBuddy expression={buddyExpression} animation={buddyAnimation} />
                                </div>

                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                                        AI Study Buddy
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {isTyping ? 'Sedang mengetik...' : 'Always here to help! 🌟'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Sound toggle */}
                                <button
                                    onClick={handleToggleSound}
                                    className="p-2 rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 transition-all"
                                    title={soundEnabled ? "Mute sound" : "Enable sound"}
                                >
                                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>

                                {/* New chat button */}
                                <button
                                    onClick={handleStartNewChat}
                                    className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages container */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
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
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3">
                                    Halo! Mau belajar apa hari ini? 👋
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                                    Aku bisa bantu kamu dengan PR, jelasin materi, atau just ngobrol kalau kamu butuh teman!
                                </p>

                                {/* Quick suggestions */}
                                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto px-4">
                                    {quickSuggestions.map((suggestion, i) => (
                                        <motion.button
                                            key={i}
                                            onClick={() => dispatch(setInputValue(suggestion.replace(/^[^\s]+\s/, '')))}
                                            className="px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            <>
                                {messages.map((message, index) => (
                                    <div
                                        key={message.id || index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
                                    >
                                        <div className={`max-w-[85%] sm:max-w-[75%]`}>
                                            <MessageBubble message={message} isUser={message.role === 'user'} />
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 px-2">
                                                {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start message-assistant">
                                        <div className="max-w-[85%] sm:max-w-[75%]">
                                            <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-4 bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2.5 h-2.5 bg-violet-500 rounded-full typing-dot"></div>
                                                    <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full typing-dot"></div>
                                                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full typing-dot"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                </div>

                {/* Input area */}
                <div className="p-4 border-t border-gray-200/50 dark:border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur-md">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="Tulis pesan..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-white/10 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 disabled:opacity-50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base transition-all"
                            />
                            <motion.button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
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
