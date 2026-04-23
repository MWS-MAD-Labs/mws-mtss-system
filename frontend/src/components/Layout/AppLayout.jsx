import React, { useMemo, memo, useCallback } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
    Home,
    Briefcase,
    Wallet,
    Bell,
    MessageSquare,
    ListChecks,
} from "lucide-react";
import { motion } from "framer-motion";

/* ================= Role-based nav ================= */
const navItemsClient = [
    { path: "/client/dashboard", icon: Home, label: "Home" },
    { path: "/post-job", icon: Briefcase, label: "Post" },
    { path: "/client/wallet", icon: Wallet, label: "Wallet" },
    { path: "/worker/chat", icon: MessageSquare, label: "Chat" },
];

const navItemsWorker = [
    { path: "/worker/dashboard", icon: Home, label: "Home" },
    { path: "/worker/jobs", icon: ListChecks, label: "Tasks" },
    { path: "/worker/wallet", icon: Wallet, label: "Wallet" },
    { path: "/worker/chat", icon: MessageSquare, label: "Chat" },
];

// Memoized navigation item component
const NavItem = memo(({ item, isActive, onClick }) => {
    const IconComponent = item.icon;
    return (
        <Link
            to={item.path}
            onClick={onClick}
            className={`nav-item hover-card flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${isActive
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm ring-1 ring-accent/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
            aria-current={isActive ? "page" : undefined}
        >
            <IconComponent className="h-5 w-5" aria-hidden />
            <span className="text-compact">{item.label}</span>
        </Link>
    );
});
NavItem.displayName = 'NavItem';

// Memoized mobile nav item component
const MobileNavItem = memo(({ item, isActive }) => {
    const IconComponent = item.icon;
    return (
        <li>
            <Link
                to={item.path}
                className={`nav-item hover-card flex flex-col items-center gap-1 rounded-lg p-2 ${isActive ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                    }`}
                aria-current={isActive ? "page" : undefined}
            >
                <IconComponent
                    className={`h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    aria-hidden
                />
                {isActive && (
                    <motion.div
                        layoutId="active-nav-indicator"
                        className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"
                        aria-hidden
                    />
                )}
            </Link>
        </li>
    );
});
MobileNavItem.displayName = 'MobileNavItem';

const AppLayout = memo(() => {
    const location = useLocation();
    const isWorker = location.pathname.startsWith("/worker");

    const navItems = useMemo(() => (isWorker ? navItemsWorker : navItemsClient), [isWorker]);

    const handleNavClick = useCallback((path) => {
        // Preload route on hover for better UX
        // This can be enhanced with route preloading
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {/* ======= HEADER (liquid glass) ======= */}
            <header className="sticky top-0 z-40">
                <div className="relative border-b border-border/50 glass-strong">
                    {/* decorative subtle grid */}
                    <div className="pointer-events-none absolute inset-0 bg-grid-small opacity-10 dark:opacity-15" aria-hidden />
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        {/* Logo */}
                        <Link
                            to={isWorker ? "/worker/dashboard" : "/client/dashboard"}
                            className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
                            aria-label="Go to home"
                        >
                            Kerjain
                        </Link>

                        {/* Desktop nav */}
                        <nav className="hidden md:flex items-center gap-2">
                            {navItems.map((item) => {
                                const active = location.pathname.startsWith(item.path);
                                return (
                                    <NavItem
                                        key={item.path}
                                        item={item}
                                        isActive={active}
                                        onClick={() => handleNavClick(item.path)}
                                    />
                                );
                            })}
                        </nav>

                        {/* Right actions */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/notifications"
                                className="relative rounded-full p-2 hover-card"
                                aria-label="Notifications"
                            >
                                <Bell className="h-6 w-6 text-muted-foreground hover:text-accent" />
                                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                            </Link>

                            <Link to="/profile" aria-label="Profile">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground hover:opacity-90">
                                    U
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ======= MAIN ======= */}
            <main className="container mx-auto flex-grow px-4 py-6 md:py-10">
                <Outlet />
            </main>

            {/* ======= MOBILE NAV (liquid glass) ======= */}
            <footer className="sticky bottom-0 z-40 md:hidden">
                <nav className="mx-2 mb-2 glass-strong rounded-2xl px-3 py-2 shadow-lg">
                    <ul className="flex items-center justify-around">
                        {navItems.map((item) => {
                            const active = location.pathname.startsWith(item.path);
                            return (
                                <MobileNavItem
                                    key={item.path}
                                    item={item}
                                    isActive={active}
                                />
                            );
                        })}
                    </ul>
                </nav>
            </footer>
        </div>
    );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;
