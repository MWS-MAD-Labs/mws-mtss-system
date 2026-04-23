/**
 * QuickMenu — collapsible floating action menu
 * - Burger → X morph via GSAP timeline
 * - Item stagger entrance via anime.js (v4 named exports)
 * - iOS Liquid Glass on mobile (CSS backdrop-filter)
 * - Navigation shortcuts + dark mode toggle + logout
 */
import { memo, useState, useCallback, useRef, useEffect } from "react";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "@/store/slices/authSlice";
import { applyThemePreference, emitThemeSpell, persistTheme } from "@/lib/theme";
import gsap from "gsap";
import { animate, stagger } from "animejs";
import "./quick-menu.css";

/* ── Helpers ───────────────────────────────────────────── */
const getIsDark = () => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
};

/* ── Nav items config (easily extendable) ──────────────── */
const NAV_ITEMS = [
    { id: "profile", label: "My Profile", icon: User, path: "/profile" },
];

/* ── Component ─────────────────────────────────────────── */
const QuickMenu = memo(() => {
    const { isAuthenticated, user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [isOpen, setIsOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDark, setIsDark] = useState(getIsDark);

    /* refs */
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const line1 = useRef(null);
    const line2 = useRef(null);
    const line3 = useRef(null);
    const itemsRef = useRef([]);
    const burgerTl = useRef(null);
    const confirmTimer = useRef(null);

    /* sync dark state when theme changes externally */
    useEffect(() => {
        const handler = () => setIsDark(getIsDark());
        window.addEventListener("mws:theme-spell", handler);
        return () => window.removeEventListener("mws:theme-spell", handler);
    }, []);

    /* GSAP burger → X timeline (built once) */
    useEffect(() => {
        if (!line1.current) return;
        const tl = gsap.timeline({ paused: true });
        tl.to(line1.current, { rotate: 45, y: 5.5, duration: 0.26, ease: "back.out(2)" }, 0)
            .to(line2.current, { opacity: 0, scaleX: 0, duration: 0.14, ease: "power2.in" }, 0)
            .to(line3.current, { rotate: -45, y: -5.5, duration: 0.26, ease: "back.out(2)" }, 0);
        burgerTl.current = tl;
        return () => tl.kill();
    }, []);

    /* Open panel */
    const open = useCallback(() => {
        setIsOpen(true);
        burgerTl.current?.play();
    }, []);

    /* Animate items after panel mounts */
    const animateIn = useCallback(() => {
        const items = itemsRef.current.filter(Boolean);
        if (!items.length) return;
        gsap.set(items, { opacity: 0, y: -6 });
        animate(items, {
            opacity: [0, 1],
            translateY: [-6, 0],
            delay: stagger(45, { start: 50 }),
            duration: 240,
            ease: "outExpo",
        });
    }, []);

    /* Close panel */
    const close = useCallback(() => {
        burgerTl.current?.reverse();
        if (!panelRef.current) { setIsOpen(false); return; }
        const isMobile = window.innerWidth < 768;
        gsap.to(panelRef.current, {
            opacity: 0,
            scale: 0.92,
            y: isMobile ? 6 : -6,
            duration: 0.20,
            ease: "power2.in",
            onComplete: () => setIsOpen(false),
        });
    }, []);

    const toggle = useCallback(() => {
        if (isOpen) close(); else open();
    }, [isOpen, open, close]);

    /* Panel entrance after mount — direction-aware for mobile (opens upward) */
    useEffect(() => {
        if (!isOpen || !panelRef.current) return;
        const isMobile = window.innerWidth < 768;
        const origin = isMobile ? "bottom left" : "top left";
        const yFrom = isMobile ? 10 : -10;
        gsap.fromTo(
            panelRef.current,
            { opacity: 0, scale: 0.88, y: yFrom, transformOrigin: origin },
            { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.6)", onComplete: animateIn }
        );
    }, [isOpen, animateIn]);

    /* Click-outside to close */
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (
                panelRef.current?.contains(e.target) ||
                triggerRef.current?.contains(e.target)
            ) return;
            close();
        };
        document.addEventListener("pointerdown", handler, { passive: true });
        return () => document.removeEventListener("pointerdown", handler);
    }, [isOpen, close]);

    /* Close on route change */
    useEffect(() => {
        if (isOpen) close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => () => clearTimeout(confirmTimer.current), []);

    /* Reset logout state whenever the logged-in user changes (e.g. re-login
       after logout) — prevents stale "Signing out…" from a previous session */
    useEffect(() => {
        setLoading(false);
        setConfirming(false);
        clearTimeout(confirmTimer.current);
    }, [user?.email]);

    /* Nav item click */
    const handleNav = useCallback((e, path) => {
        animate(e.currentTarget, {
            scale: [1, 0.93, 1],
            duration: 220,
            ease: "outElastic(1, .7)",
        });
        setTimeout(() => {
            close();
            navigate(path);
        }, 120);
    }, [close, navigate]);

    /* Dark mode toggle */
    const handleDarkMode = useCallback((e) => {
        const next = isDark ? "light" : "dark";
        setIsDark(!isDark);
        applyThemePreference(next);
        persistTheme(next);
        const rect = e.currentTarget.getBoundingClientRect();
        emitThemeSpell({
            theme: next,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            trigger: "user",
        });
        animate(e.currentTarget, {
            scale: [1, 0.88, 1.08, 1],
            duration: 380,
            ease: "outElastic(1, .55)",
        });
    }, [isDark]);

    /* Logout */
    const handleLogout = useCallback((e) => {
        if (!confirming) {
            setConfirming(true);
            confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
            animate(e.currentTarget, {
                translateX: [-5, 5, -4, 4, 0],
                duration: 320,
                ease: "inOutSine",
            });
            return;
        }
        setLoading(true);
        dispatch(logoutUser())
            .unwrap()
            .catch(() => { })
            .finally(() => {
                setLoading(false);
                setConfirming(false);
                navigate("/");
            });
    }, [confirming, dispatch, navigate]);

    if (!isAuthenticated) return null;

    /* item index counter (for ref array) */
    let idx = 0;

    return (
        <div className="qm-root">
            {/* ── Trigger ── */}
            <button
                ref={triggerRef}
                type="button"
                onClick={toggle}
                className="qm-trigger"
                aria-label="Quick menu"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <div className="qm-burger" aria-hidden="true">
                    <span ref={line1} className="qm-burger-line" />
                    <span ref={line2} className="qm-burger-line" />
                    <span ref={line3} className="qm-burger-line" />
                </div>
                <span className="qm-trigger-label">Menu</span>
            </button>

            {/* ── Panel ── */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="qm-panel"
                    role="menu"
                    aria-label="Quick actions"
                >
                    {/* Invisible backdrop */}
                    <div className="qm-backdrop" aria-hidden="true" onPointerDown={close} />

                    <div className="qm-panel-inner">

                        {/* ── Section: Navigate ── */}
                        <p className="qm-section-label">Navigate</p>

                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            const i = idx++;
                            return (
                                <button
                                    key={item.id}
                                    ref={(el) => (itemsRef.current[i] = el)}
                                    type="button"
                                    className={`qm-item qm-item--btn${isActive ? " qm-item--active" : ""}`}
                                    onClick={(e) => handleNav(e, item.path)}
                                    role="menuitem"
                                >
                                    <div className="qm-item-icon">
                                        <Icon size={14} />
                                    </div>
                                    <span className="qm-item-label">{item.label}</span>
                                    {isActive && <span className="qm-item-dot" aria-hidden="true" />}
                                </button>
                            );
                        })}

                        <div className="qm-divider" role="separator" />

                        {/* ── Section: Preferences ── */}
                        <p className="qm-section-label">Preferences</p>

                        {/* Dark Mode */}
                        <div
                            ref={(el) => (itemsRef.current[idx++] = el)}
                            className="qm-item"
                            role="menuitem"
                        >
                            <div className="qm-item-icon">
                                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                            </div>
                            <span className="qm-item-label">
                                {isDark ? "Light Mode" : "Dark Mode"}
                            </span>
                            <button
                                type="button"
                                className={`qm-toggle${isDark ? " qm-toggle--on" : ""}`}
                                onClick={handleDarkMode}
                                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                aria-pressed={isDark}
                            >
                                <span className="qm-toggle-thumb" />
                            </button>
                        </div>

                        <div className="qm-divider" role="separator" />

                        {/* ── Log Out ── */}
                        <button
                            ref={(el) => (itemsRef.current[idx++] = el)}
                            type="button"
                            className={`qm-item qm-item--btn${confirming ? " qm-item--danger" : ""}`}
                            onClick={handleLogout}
                            role="menuitem"
                            disabled={loading}
                        >
                            <div className="qm-item-icon">
                                <LogOut
                                    size={14}
                                    className={loading ? "animate-spin" : ""}
                                    style={{ animationDuration: "0.9s" }}
                                />
                            </div>
                            <span className="qm-item-label">
                                {loading ? "Signing out…" : confirming ? "Tap again to confirm" : "Log Out"}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

QuickMenu.displayName = "QuickMenu";
export default QuickMenu;
