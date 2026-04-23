import { useState, useCallback, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import { Home, RotateCcw, Sparkles } from "lucide-react";

/* ───── floating particle (CSS animation, no JS rerender) ───── */
function Particle({ size, x, duration, delay }) {
    return (
        <div
            className="absolute rounded-full"
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                animation: `float-up ${duration}s ${delay}s linear infinite`,
                background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent)",
            }}
        />
    );
}

/* ───── ghost character with expressions ───── */
function Ghost({ mouseX, mouseY, mood }) {
    const eyeOffsetX = useTransform(mouseX, [-300, 300], [-5, 5]);
    const eyeOffsetY = useTransform(mouseY, [-300, 300], [-4, 4]);

    return (
        <motion.div
            className="relative select-none cursor-grab active:cursor-grabbing"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            drag
            dragConstraints={{ top: -30, bottom: 30, left: -40, right: 40 }}
            dragElastic={0.3}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 15 }}
            whileDrag={{ scale: 1.1 }}
        >
            {/* shadow on ground */}
            <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-3 sm:w-20 sm:h-4 rounded-full bg-black/8 dark:bg-black/20 blur-sm"
                animate={{ scaleX: [1, 0.8, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* body */}
            <div className="relative w-24 h-32 sm:w-32 sm:h-40">
                <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-200 dark:via-gray-250 dark:to-gray-300 shadow-lg" />

                {/* wavy bottom */}
                <motion.svg
                    className="absolute -bottom-3 left-0 w-full"
                    viewBox="0 0 120 24"
                    fill="none"
                    animate={{ x: [0, -3, 0, 3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <path
                        d="M0 0 L0 12 Q10 24 20 12 Q30 0 40 12 Q50 24 60 12 Q70 0 80 12 Q90 24 100 12 Q110 0 120 12 L120 0Z"
                        className="fill-gray-100 dark:fill-gray-300"
                    />
                </motion.svg>

                {/* eyes */}
                <div className="absolute top-[36%] left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4">
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            className="relative w-5 h-6 sm:w-7 sm:h-8 bg-white dark:bg-gray-50 rounded-full shadow-inner flex items-center justify-center overflow-hidden"
                        >
                            <motion.div
                                className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-gray-800 dark:bg-gray-900 relative"
                                style={{ x: eyeOffsetX, y: eyeOffsetY }}
                            >
                                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white/80" />
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* blush */}
                <motion.div
                    className="absolute top-[54%] left-[15%] w-4 h-2.5 sm:w-5 sm:h-3 rounded-full bg-pink-300/40"
                    animate={{ opacity: mood === "happy" ? 0.6 : 0.3 }}
                />
                <motion.div
                    className="absolute top-[54%] right-[15%] w-4 h-2.5 sm:w-5 sm:h-3 rounded-full bg-pink-300/40"
                    animate={{ opacity: mood === "happy" ? 0.6 : 0.3 }}
                />

                {/* mouth */}
                <AnimatePresence mode="wait">
                    {mood === "happy" ? (
                        <motion.div
                            key="happy"
                            className="absolute top-[62%] left-1/2 -translate-x-1/2 w-4 h-2.5 sm:w-5 sm:h-3 border-b-2 border-gray-500 rounded-b-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        />
                    ) : mood === "surprised" ? (
                        <motion.div
                            key="surprised"
                            className="absolute top-[61%] left-1/2 -translate-x-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-gray-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        />
                    ) : (
                        <motion.div
                            key="neutral"
                            className="absolute top-[63%] left-1/2 -translate-x-1/2 w-3.5 h-0.5 sm:w-4 bg-gray-400 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        />
                    )}
                </AnimatePresence>

                {/* sparkle when happy */}
                {mood === "happy" && (
                    <motion.div
                        className="absolute -top-2 -right-1 text-yellow-400"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: [0, 1.2, 1], rotate: [0, 15, 0] }}
                        transition={{ duration: 0.4 }}
                    >
                        <Sparkles className="h-4 w-4" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

/* ───── interactive "404" digit ───── */
function Digit404({ char, index, onTap }) {
    const [taps, setTaps] = useState(0);
    const colors = [
        "from-primary to-accent",
        "from-accent to-gold",
        "from-gold to-emerald",
        "from-emerald to-primary",
    ];

    const handleTap = () => {
        setTaps((t) => t + 1);
        onTap?.();
    };

    return (
        <motion.span
            className={`inline-block cursor-pointer select-none font-bold text-6xl sm:text-7xl md:text-8xl bg-gradient-to-br ${colors[taps % colors.length]} bg-clip-text text-transparent`}
            style={{
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))",
                fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
                letterSpacing: "-0.02em",
            }}
            initial={{ y: 40, opacity: 0, rotateZ: index === 1 ? 10 : -10 }}
            animate={{ y: 0, opacity: 1, rotateZ: 0 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 16,
                delay: 0.12 * index,
            }}
            whileHover={{
                scale: 1.15,
                rotateZ: index === 1 ? 8 : -8,
                transition: { type: "spring", stiffness: 400 },
            }}
            whileTap={{ scale: 0.8, rotateZ: index === 1 ? -15 : 15 }}
            onTap={handleTap}
        >
            {char}
        </motion.span>
    );
}

/* ───── tap counter badge ───── */
function TapCounter({ count }) {
    if (count === 0) return null;
    return (
        <motion.div
            key={count}
            className="absolute -top-2 -right-2 text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
            style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
            {count > 99 ? "99+" : count}
        </motion.div>
    );
}

/* ───── fun messages ───── */
const funMessages = [
    { text: "Looks like you wandered off the map!", mood: "neutral" },
    { text: "This page is on vacation. Try another!", mood: "happy" },
    { text: "Oops! Dead end ahead.", mood: "neutral" },
    { text: "You found a secret room... it's empty!", mood: "surprised" },
    { text: "Error 404: Motivation not found.", mood: "neutral" },
    { text: "This page left to find itself.", mood: "happy" },
    { text: "Plot twist: this page never existed.", mood: "surprised" },
    { text: "The ghost ate this page. Sorry!", mood: "happy" },
    { text: "Nothing here but vibes.", mood: "happy" },
    { text: "You're lost, but at least you have company!", mood: "happy" },
];

const tapMilestones = {
    5: { text: "Nice tapping! Keep going!", mood: "happy" },
    15: { text: "You really like clicking things, huh?", mood: "surprised" },
    30: { text: "Achievement unlocked: Persistent clicker!", mood: "happy" },
    50: { text: "Okay, you win. The ghost is impressed.", mood: "happy" },
};

/* ═══════ main component ═══════ */
export default function NotFound() {
    const containerRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

    const [msgIdx, setMsgIdx] = useState(0);
    const [totalTaps, setTotalTaps] = useState(0);
    const [milestoneMsg, setMilestoneMsg] = useState(null);

    const currentMsg = milestoneMsg || funMessages[msgIdx];

    const handleMouseMove = useCallback(
        (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseX.set(e.clientX - rect.left - rect.width / 2);
            mouseY.set(e.clientY - rect.top - rect.height / 2);
        },
        [mouseX, mouseY]
    );

    const shuffleMsg = () => {
        setMilestoneMsg(null);
        setMsgIdx((i) => {
            let next;
            do {
                next = Math.floor(Math.random() * funMessages.length);
            } while (next === i && funMessages.length > 1);
            return next;
        });
    };

    const handleDigitTap = () => {
        const newTotal = totalTaps + 1;
        setTotalTaps(newTotal);
        if (tapMilestones[newTotal]) {
            setMilestoneMsg(tapMilestones[newTotal]);
        }
    };

    const particles = useMemo(
        () =>
            Array.from({ length: 8 }, (_, i) => ({
                id: i,
                delay: i * 1.5,
                size: 4 + Math.random() * 8,
                x: 5 + Math.random() * 90,
                duration: 7 + Math.random() * 5,
            })),
        []
    );

    return (
        <AnimatedPage>
            <Helmet>
                <title>Page not found — Kerjain</title>
            </Helmet>

            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(80vh); opacity: 0; }
                    15% { opacity: 0.4; }
                    85% { opacity: 0.2; }
                    100% { transform: translateY(-10vh); opacity: 0; }
                }
            `}</style>

            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-8"
            >
                {/* particles */}
                {particles.map((p) => (
                    <Particle key={p.id} {...p} />
                ))}

                {/* iOS-style centered card */}
                <motion.div
                    className="relative z-10 flex flex-col items-center w-full max-w-sm"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {/* ghost */}
                    <div className="mb-2">
                        <Ghost mouseX={springX} mouseY={springY} mood={currentMsg.mood} />
                    </div>

                    {/* 404 digits */}
                    <div className="relative flex items-center justify-center gap-0.5 mb-3">
                        {["4", "0", "4"].map((ch, i) => (
                            <Digit404 key={i} char={ch} index={i} onTap={handleDigitTap} />
                        ))}
                        <TapCounter count={totalTaps} />
                    </div>

                    {/* iOS-style subtitle card */}
                    <motion.div
                        className="w-full rounded-2xl px-6 py-5 mb-5 text-center"
                        style={{
                            background: "hsl(var(--card))",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
                            border: "1px solid hsl(var(--border) / 0.5)",
                        }}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        {/* message */}
                        <div className="min-h-[2.5rem] flex items-center justify-center mb-3">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentMsg.text}
                                    className="text-[15px] leading-relaxed"
                                    style={{
                                        color: "hsl(var(--muted-foreground))",
                                        fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
                                    }}
                                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {currentMsg.text}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* shuffle - iOS tappable row */}
                        <button
                            onClick={shuffleMsg}
                            className="group inline-flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors duration-200 active:opacity-60"
                            style={{ color: "hsl(var(--primary))" }}
                        >
                            <RotateCcw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
                            Shuffle message
                        </button>
                    </motion.div>

                    {/* iOS-style hint */}
                    <motion.p
                        className="text-[12px] mb-5 text-center"
                        style={{
                            color: "hsl(var(--muted-foreground) / 0.5)",
                            fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Tap the numbers or drag the ghost
                    </motion.p>

                    {/* iOS-style button */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                    >
                        <Link to="/">
                            <button
                                className="inline-flex items-center justify-center gap-2 rounded-[14px] px-7 py-3 text-[15px] font-semibold transition-all duration-200 active:scale-95 active:opacity-80"
                                style={{
                                    background: "hsl(var(--primary))",
                                    color: "hsl(var(--primary-foreground))",
                                    fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
                                    boxShadow: "0 2px 8px hsl(var(--primary) / 0.3), 0 1px 2px hsl(var(--primary) / 0.2)",
                                }}
                            >
                                <Home className="h-4 w-4" />
                                Back to Home
                            </button>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </AnimatedPage>
    );
}
