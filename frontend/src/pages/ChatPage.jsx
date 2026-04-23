// ChatPage.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/feedback/EmptyState";
import AnimatedPage from "@/components/AnimatedPage";
import { Helmet } from "react-helmet";

// Dummy data: chat list
const chatList = [
    {
        id: 1,
        name: "Budi Santoso",
        initials: "B",
        lastMsg: "Hello, I’m on my way to your location.",
        time: "10:30",
        online: true,
    },
    {
        id: 2,
        name: "Citra Dewi",
        initials: "C",
        lastMsg: "Okay, let's continue tomorrow!",
        time: "Yesterday",
        online: false,
    },
    {
        id: 3,
        name: "Andi W.",
        initials: "A",
        lastMsg: "Thank you for completing it 👍",
        time: "Monday",
        online: false,
    },
];

export default function ChatPage() {
    const [search, setSearch] = useState("");

    // Sanitizer → cegah script injection & link aneh
    const sanitizeInput = (value) =>
        value.replace(/<[^>]*>?/gm, "").replace(/https?:\/\/\S+/g, "");

    const filteredChats = chatList.filter((chat) =>
        chat.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatedPage>
            <Helmet>
                <title>Chat — MWS IntegraLearn</title>
            </Helmet>

            <div className="relative mx-auto flex h-dvh max-w-lg flex-col backdrop-blur-xl backdrop-saturate-150">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="z-10 flex items-center justify-between border-b border-border/50 px-3 py-2 sm:px-4 sm:py-3"
                >
                    <h1 className="text-base sm:text-lg font-semibold text-foreground">
                        Chat
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Compact search (always visible on mobile) */}
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sanitize="strong"
                            placeholder="Search..."
                            className="w-28 sm:w-40 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent/50 transition-all duration-300"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-accent/20 hover:text-accent transition-colors duration-300"
                        >
                            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                </motion.div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4 space-y-2 sm:space-y-3">
                    {filteredChats.length > 0 ? (
                        filteredChats.map((chat, i) => (
                            <motion.div
                                key={chat.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.05 }}
                            >
                                <Link
                                    to={`/chat/${chat.id}`}
                                    className="flex w-full items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-border/40 bg-card/40 p-2.5 sm:p-3 shadow-sm backdrop-blur-lg transition-all duration-300 hover:border-accent/60 hover:bg-card/70"
                                >
                                    {/* Avatar */}
                                    <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs sm:text-sm font-semibold text-primary-foreground">
                                        {chat.initials}
                                        {chat.online && (
                                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400 ring-2 ring-background"></span>
                                        )}
                                    </div>

                                    {/* Chat Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-xs sm:text-sm font-semibold text-foreground">
                                                {chat.name}
                                            </p>
                                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                                                {chat.time}
                                            </span>
                                        </div>
                                        <p className="truncate text-[11px] sm:text-xs text-muted-foreground">
                                            {chat.lastMsg}
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    ) : (
                        <div className="px-3 py-6">
                            <EmptyState
                                title="No conversations yet"
                                subtitle="Your chats will appear here."
                                icon={<Search className="h-6 w-6" />}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}
