// src/pages/RoomChat.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnimatedSlidePage from "@/components/AnimatedSlidePage";
import { Helmet } from "react-helmet";
import {
    chatList,
    currentTime,
    initialMessages,
    sanitizeMessage,
} from "@/pages/chat/roomChatData";

/* ---------------- Message Bubble ---------------- */
const MessageBubble = React.memo(({ msg }) => {
    const mine = msg.sender === "me";
    return (
        <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[78%] px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl transition-colors duration-300 shadow-sm text-sm ${mine
                    ? "rounded-br-none bg-primary text-primary-foreground"
                    : "rounded-bl-none bg-card/70 text-foreground border border-border/40"
                    }`}
            >
                <p className="leading-relaxed break-words">{msg.text}</p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-right text-muted-foreground">
                    {msg.time}
                </p>
            </div>
        </div>
    );
});

/* ---------------- Main ---------------- */
export default function RoomChat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();

    const selectedChat = useMemo(
        () => chatList.find((c) => String(c.id) === String(id)),
        [id]
    );

    useEffect(() => {
        if (!selectedChat) {
            navigate("/worker/chat" || "/client/chat", { replace: true });
        }
    }, [selectedChat, navigate]);

    const [messages, setMessages] = useState(initialMessages);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);

    const handleSend = useCallback(
        (e) => {
            e && e.preventDefault();
            const clean = sanitizeMessage(text, 600);
            if (!clean) return;

            const next = { id: Date.now(), sender: "me", text: clean, time: currentTime() };
            setSending(true);
            setMessages((prev) => [...prev, next]);
            setText("");

            setTimeout(() => setSending(false), 400);
        },
        [text]
    );

    useEffect(() => {
        if (listRef.current) {
            const t = setTimeout(() => {
                listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
            }, 80);
            return () => clearTimeout(t);
        }
    }, [messages]);

    if (!selectedChat) return null;

    const headerAnim = reduceMotion
        ? {}
        : { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.32 } };

    return (
        <AnimatedSlidePage onSwipeBack={() => navigate("/worker/chat" || "/client/chat")}>
            <Helmet>
                <title>Chat with {selectedChat.name} - MWS IntegraLearn</title>
            </Helmet>

            <div className="relative mx-auto flex h-dvh max-w-lg flex-col">
                {/* Header */}
                <motion.header
                    {...headerAnim}
                    className="flex items-center gap-3 border-b border-border/50 bg-background/70 px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-xl"
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-accent/20 hover:text-accent transition-colors duration-300"
                        onClick={() => navigate("/worker/chat" || "/client/chat")}
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs sm:text-sm font-semibold text-primary-foreground">
                            {selectedChat.initials}
                            {selectedChat.online && (
                                <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-sm sm:text-base font-semibold text-foreground">
                                {selectedChat.name}
                            </h1>
                            <p
                                className={`text-xs ${selectedChat.online ? "text-emerald-400" : "text-muted-foreground"
                                    }`}
                            >
                                {selectedChat.online ? "Online" : "Offline"}
                            </p>
                        </div>
                    </div>
                </motion.header>

                {/* Messages */}
                <motion.div
                    ref={listRef}
                    className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3 sm:space-y-4"
                >
                    {messages.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
                            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.02 }}
                        >
                            <MessageBubble msg={m} />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Input Area */}
                <motion.form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 border-t border-border/50 bg-background/70 px-2 sm:px-3 py-2 backdrop-blur-xl"
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="rounded-full hover:bg-accent/20 hover:text-accent transition-colors duration-300"
                        aria-label="Attach file"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>

                    <Input
                        aria-label="Type a message"
                        placeholder="Write a message..."
                        value={text}
                        onChange={(e) => setText(sanitizeMessage(e.target.value, 600))}
                        className="flex-1 rounded-full border border-border/40 bg-card/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent/40 transition-all duration-300"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    <Button
                        size="icon"
                        type="submit"
                        disabled={sending || !text.trim()}
                        className="rounded-full bg-primary hover:bg-primary/90 transition-colors duration-300 shadow-md disabled:opacity-50"
                        aria-label="Send message"
                    >
                        <Send className="h-5 w-5 text-primary-foreground" />
                    </Button>
                </motion.form>
            </div>
        </AnimatedSlidePage>
    );
}
