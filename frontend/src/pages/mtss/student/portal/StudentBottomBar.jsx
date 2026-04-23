import { memo } from "react";
import { BookOpenCheck, Home, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const STUDENT_BOTTOM_NAV = [
    {
        key: "hub",
        label: "Hub",
        path: "/student/support-hub",
        icon: Home,
        activeWhen: (pathname) => pathname.startsWith("/student/support-hub"),
    },
    {
        key: "mtss",
        label: "MTSS",
        path: "/mtss/student-portal",
        icon: BookOpenCheck,
        activeWhen: (pathname) => pathname.startsWith("/mtss/student-portal"),
    },
    {
        key: "profile",
        label: "Profile",
        path: "/profile",
        icon: UserRound,
        activeWhen: (pathname) => pathname.startsWith("/profile"),
    },
];

const StudentBottomBar = ({ badges = { hub: 0, mtss: 0, profile: 0 } }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="fixed bottom-0 left-1/2 z-40 w-[min(520px,calc(100vw-1rem))] -translate-x-1/2 px-1.5 pb-[calc(env(safe-area-inset-bottom)+0.55rem)]">
            <div className="ios-glass rounded-[30px] border border-white/75 bg-white/78 px-2 py-2 shadow-[0_18px_38px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/20 dark:bg-slate-900/78 dark:shadow-[0_18px_44px_rgba(3,7,18,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="grid grid-cols-3 gap-2">
                    {STUDENT_BOTTOM_NAV.map((item) => {
                        const Icon = item.icon;
                        const active = item.activeWhen(location.pathname);
                        const badgeValue = Number(badges[item.key] || 0);

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className={`relative ios-lift flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2.5 text-[10px] font-bold transition-all ${active
                                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md"
                                    : "ios-glass-soft bg-white/72 text-slate-600 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                }`}
                            >
                                <Icon className="h-[18px] w-[18px]" />
                                <span>{item.label}</span>
                                {badgeValue > 0 && (
                                    <span className="absolute -right-1.5 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-[0_6px_12px_rgba(244,63,94,0.4)]">
                                        {badgeValue > 9 ? "9+" : badgeValue}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

StudentBottomBar.displayName = "StudentBottomBar";
export default memo(StudentBottomBar);
