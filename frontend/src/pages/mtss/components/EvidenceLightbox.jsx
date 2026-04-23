import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { downloadEvidenceFile } from "./evidenceDownloadUtils";

const EvidenceLightbox = memo(({ images = [], initialIndex = 0, onClose }) => {
    const [current, setCurrent] = useState(initialIndex);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        setCurrent(initialIndex);
    }, [initialIndex]);

    const goPrev = useCallback(() => setCurrent((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
    const goNext = useCallback(() => setCurrent((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowLeft") goPrev();
            else if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", handler);
        const previousOverflow = document.body.style.overflow;
        const previousOverscroll = document.body.style.overscrollBehavior;
        const previousTouchAction = document.body.style.touchAction;
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        document.body.style.touchAction = "none";
        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = previousOverflow;
            document.body.style.overscrollBehavior = previousOverscroll;
            document.body.style.touchAction = previousTouchAction;
        };
    }, [onClose, goPrev, goNext]);

    const handleDownload = useCallback(async () => {
        if (isDownloading) return;
        const currentItem = images[current];
        if (!currentItem) return;
        setIsDownloading(true);
        try {
            await downloadEvidenceFile(currentItem);
        } finally {
            setIsDownloading(false);
        }
    }, [current, images, isDownloading]);

    const item = images[current];
    if (!item) return null;

    const fileLabel = item.fileName || `Image ${current + 1}`;

    const actionBtnClass = "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-xl transition hover:bg-white/30 active:scale-95";
    const navBtnClass = "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/35 bg-white/18 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/28 active:scale-[0.98]";

    const portalTarget = typeof document !== "undefined" ? document.body : null;
    if (!portalTarget) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[2147483647] p-0 sm:p-4 md:p-6"
                role="dialog"
                aria-modal="true"
                aria-label="Evidence viewer"
                style={{ isolation: "isolate" }}
            >
                <motion.button
                    type="button"
                    aria-label="Close lightbox"
                    className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.985 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="relative z-[1] mx-auto flex h-[100dvh] w-full flex-col overflow-hidden bg-[#111829]/94 backdrop-blur-2xl sm:h-[min(90vh,860px)] sm:w-[min(96vw,980px)] sm:rounded-[32px] sm:border sm:border-white/30 sm:bg-gradient-to-b sm:from-[#1a2439]/95 sm:via-[#141d30]/95 sm:to-[#0f1626]/95"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/15 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.7rem)] sm:px-5 sm:pt-4">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.28em] text-white/65">Evidence</p>
                            <p className="truncate text-sm font-semibold text-white sm:text-base">{fileLabel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white/90 sm:text-xs">
                                {current + 1}/{images.length}
                            </span>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className={actionBtnClass}
                                title={isDownloading ? "Downloading..." : "Download"}
                                disabled={isDownloading}
                            >
                                <Download className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                            </button>
                            <button type="button" onClick={onClose} className={actionBtnClass} title="Close">
                                <X className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
                        <motion.img
                            key={item.url}
                            src={item.url}
                            alt={item.fileName || "Evidence"}
                            initial={{ opacity: 0, scale: 0.965 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22 }}
                            className="max-h-full max-w-full rounded-[22px] border border-white/30 bg-black/15 object-contain shadow-[0_24px_70px_rgba(0,0,0,0.45)] select-none"
                            draggable={false}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="hidden sm:inline-flex absolute left-4 lg:left-6 h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/18 text-white backdrop-blur-xl transition hover:bg-white/28 active:scale-95"
                                    title="Previous"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="hidden sm:inline-flex absolute right-4 lg:right-6 h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/18 text-white backdrop-blur-xl transition hover:bg-white/28 active:scale-95"
                                    title="Next"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="relative z-10 border-t border-white/15 px-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-3 sm:px-5 sm:pb-4 sm:pt-4">
                        {images.length > 1 && (
                            <div className="mx-auto mb-3 flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/25 bg-white/12 p-1.5 backdrop-blur-xl sm:hidden">
                                <button type="button" onClick={goPrev} className={navBtnClass}>
                                    <ChevronLeft className="h-4 w-4" />
                                    Prev
                                </button>
                                <button type="button" onClick={goNext} className={navBtnClass}>
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {images.length > 1 && (
                            <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto pb-1">
                                {images.map((img, idx) => {
                                    const active = idx === current;
                                    return (
                                        <button
                                            key={`${img.url || "evidence"}-${idx}`}
                                            type="button"
                                            onClick={() => setCurrent(idx)}
                                            className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border transition sm:h-14 sm:w-14 ${
                                                active
                                                    ? "border-white/90 ring-2 ring-white/80"
                                                    : "border-white/35 opacity-75 hover:opacity-100"
                                            }`}
                                            title={img.fileName || `Image ${idx + 1}`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.fileName || `Evidence ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        portalTarget,
    );
});
EvidenceLightbox.displayName = "EvidenceLightbox";

export default EvidenceLightbox;
