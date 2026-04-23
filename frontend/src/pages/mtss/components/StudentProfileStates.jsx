import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { glassStyles } from "../config/studentProfileConfig";

export const StudentProfileLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-pink-950/20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
            </div>
            <p className="text-muted-foreground font-medium">Loading student profile...</p>
        </motion.div>
    </div>
);

export const StudentProfileError = ({ error, onBack }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30 dark:from-slate-950 dark:to-rose-950/20 p-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${glassStyles.card} rounded-3xl p-8 text-center space-y-4 max-w-md shadow-2xl`}
        >
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">{error || "Student not found"}</p>
            <button
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={onBack}
            >
                Back to Students
            </button>
        </motion.div>
    </div>
);
