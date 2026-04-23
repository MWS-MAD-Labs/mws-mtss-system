import { memo } from "react";
import { motion } from "framer-motion";
import { studentTabs } from "../../data/studentPortalContent";

const StudentPortalTabs = ({ activeTab, setActiveTab, isHeaderSnapped }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.45 }}
            className={`flex flex-wrap gap-2.5 transition-all duration-300 ${isHeaderSnapped ? "pt-1" : ""}`}
        >
            {studentTabs.map((tab) => {
                const TabIcon = tab.icon;
                const active = activeTab === tab.key;
                return (
                    <motion.button
                        key={tab.key}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex ios-lift min-h-[44px] items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${active
                            ? "border-violet-200 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md dark:border-violet-400/30"
                            : "ios-glass-soft border-white/65 bg-white/70 text-slate-600 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        }`}
                    >
                        <TabIcon className="h-4 w-4" />
                        {tab.label}
                    </motion.button>
                );
            })}
        </motion.div>
    );
};

StudentPortalTabs.displayName = "StudentPortalTabs";
export default memo(StudentPortalTabs);
