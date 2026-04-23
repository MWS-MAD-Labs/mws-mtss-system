import { memo } from "react";
import { ArrowRight, MousePointerClick, Sparkles } from "lucide-react";

const PilotTaskHintBanner = ({ guide, eyebrow = "Pilot tutorial", actionLabel = "What to click next" }) => {
    if (!guide) return null;

    return (
        <section className="relative overflow-hidden rounded-[28px] border border-amber-200/80 bg-gradient-to-r from-amber-50/95 via-white to-sky-50/90 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-amber-400/20 dark:from-amber-500/10 dark:via-white/5 dark:to-sky-500/10">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-300/10" />
            <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-300/10" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        {eyebrow}
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{guide.title}</h3>
                        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-white/72">{guide.description}</p>
                    </div>
                </div>

                <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.07)] dark:border-white/15 dark:bg-white/8 lg:max-w-sm">
                    <div className="flex items-start gap-3">
                        <div className="relative mt-0.5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 text-white shadow-lg">
                            <span className="absolute inset-0 rounded-2xl animate-ping bg-amber-400/40" />
                            <MousePointerClick className="relative h-4 w-4" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">{actionLabel}</p>
                            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-white/75">
                                {(guide.bullets || []).map((bullet) => (
                                    <li key={bullet} className="flex items-start gap-2">
                                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

PilotTaskHintBanner.displayName = "PilotTaskHintBanner";

export default memo(PilotTaskHintBanner);
