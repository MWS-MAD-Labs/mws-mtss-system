// src/pages/PostJobPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, Zap, FileText, WalletMinimal, HandCoins } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import PaymentMethodPills from "@/components/Payment/PaymentMethodPills";
import PostReviewSheet from "@/components/Sheets/PostReviewSheet";
import { sanitizeLight, toRawNumber, fmtCurrency, debounce } from "@/lib/utils";

/* ---------------- motion & styles ---------------- */
const fadeSlide = (reduceMotion) => ({
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.33, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.22 } },
});

const baseInput =
    "w-full rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-320";

/* ---------------- main page ---------------- */
export default function PostJobPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const reduceMotion = useReducedMotion();

    const [mode, setMode] = useState("quick");
    const [payment, setPayment] = useState("cash");
    const [submitting, setSubmitting] = useState(false);
    const [showReview, setShowReview] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        budgetRaw: "",
        budget: "",
        durationValue: "",
        durationUnit: "jam",
        category: "",
        skills: "",
        deadline: "",
        location: "",
    });

    const dirtyRef = useRef(false);

    const canSubmit = useMemo(() => {
        const titleOk = form.title.trim().length >= 3;
        const descOk = form.description.trim().length >= (mode === "quick" ? 8 : 20);
        return titleOk && descOk && !submitting;
    }, [form.title, form.description, mode, submitting]);

    const setField = useCallback((k, v) => {
        dirtyRef.current = true;
        setForm((s) => ({ ...s, [k]: sanitizeLight(String(v)) }));
    }, []);

    const debouncedFormatBudget = useMemo(
        () =>
            debounce((raw) => {
                setForm((s) => ({ ...s, budget: raw ? fmtCurrency(Number(raw)) : "" }));
            }, 220),
        []
    );

    const handlePasteBlockLinks = useCallback(
        (e) => {
            try {
                const txt = (e.clipboardData || window.clipboardData).getData("text");
                if (/https?:\/\//i.test(txt) || /<script/i.test(txt) || /javascript:/i.test(txt) || /\b(data:|vbscript:)/i.test(txt)) {
                    e.preventDefault();
                    toast({ title: "Invalid content", description: "Links/scripts are blocked." });
                }
            } catch {
                // Ignore clipboard access errors in unsupported browsers.
            }
        },
        [toast]
    );

    const handleBudgetRaw = useCallback((rawVal) => {
        const numbers = toRawNumber(rawVal);
        setForm((s) => ({ ...s, budgetRaw: numbers }));
        debouncedFormatBudget(numbers);
    }, [debouncedFormatBudget]);

    const doSubmit = useCallback(
        async () => {
            if (!canSubmit) {
                toast({ title: "Check the form", description: "Title and description are required." });
                return;
            }
            setSubmitting(true);
            try {
                const payload = {
                    title: sanitizeLight(form.title),
                    description: sanitizeLight(form.description),
                    budget: Number(form.budgetRaw) || 0,
                    duration: `${sanitizeLight(form.durationValue || "")} ${sanitizeLight(form.durationUnit)}`.trim(),
                    category: sanitizeLight(form.category),
                    skills: sanitizeLight(form.skills),
                    deadline: form.deadline || null,
                    location: sanitizeLight(form.location),
                    payment,
                    mode,
                };
                await new Promise((r) => setTimeout(r, 600)); // fake API
                toast({ title: "Success", description: "Job posted (demo)." });
                dirtyRef.current = false;
                navigate(mode === "quick" ? "/" : "/history");
            } catch (err) {
                toast({ title: "Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
            } finally {
                setSubmitting(false);
            }
        },
        [canSubmit, form, mode, navigate, payment, toast]
    );

    const handleOpenReview = useCallback(
        (e) => {
            e?.preventDefault?.();
            if (!canSubmit) {
                toast({ title: "Periksa formulir", description: "Judul dan deskripsi perlu diisi." });
                return;
            }
            setShowReview(true);
        },
        [canSubmit, toast]
    );

    return (
        <div className="min-h-screen p-3 sm:p-6 text-foreground">
            <div className="max-w-xl mx-auto">
                {/* header */}
                <header className="flex items-center gap-3 mb-3">
                    <Link
                        to={-1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/30 bg-card/50 hover:bg-accent/10 transition-all duration-320"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-base font-semibold">Buat Pekerjaan</h1>
                        <p className="text-[11px] text-muted-foreground">Ringkas & aman.</p>
                    </div>
                </header>

                {/* form card */}
                <section className="glass-strong rounded-xl p-3 shadow-md">
                    {/* toggle */}
                    <div className="inline-flex w-full rounded-xl border border-border/30 bg-card/40 p-1 mb-3">
                        <ToggleButtonCompact
                            active={mode === "quick"}
                            onClick={() => setMode("quick")}
                            icon={<Zap className="h-4 w-4" />}
                            label="Cepat"
                        />
                        <ToggleButtonCompact
                            active={mode === "detail"}
                            onClick={() => setMode("detail")}
                            icon={<FileText className="h-4 w-4" />}
                            label="Detail"
                        />
                    </div>

                    <form onSubmit={handleOpenReview} className="space-y-3">
                        <AnimatePresence mode="wait">
                            {mode === "quick" ? (
                                <motion.div
                                    key="quick"
                                    variants={fadeSlide(reduceMotion)}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="space-y-3"
                                >
                                    {/* Judul */}
                                    <InputField
                                        label="Judul"
                                        value={form.title}
                                        onChange={(v) => setField("title", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Contoh: Antar kopi ke kantor"
                                        required
                                    />
                                    {/* Deskripsi */}
                                    <TextAreaField
                                        label="Deskripsi singkat"
                                        value={form.description}
                                        onChange={(v) => setField("description", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Tuliskan kebutuhan (min 8 karakter)"
                                        rows={3}
                                    />
                                    {/* Durasi */}
                                    <div className="flex gap-2">
                                        <input
                                            aria-label="Durasi"
                                            type="number"
                                            value={form.durationValue}
                                            onChange={(e) => setField("durationValue", e.target.value)}
                                            onPaste={handlePasteBlockLinks}
                                            placeholder="2"
                                            min={0}
                                            className="w-20 rounded-lg border border-border/40 bg-card/60 px-2 py-2 text-sm focus:ring-2 focus:ring-accent transition-all duration-320"
                                        />
                                        <select
                                            value={form.durationUnit}
                                            onChange={(e) => setField("durationUnit", e.target.value)}
                                            className="flex-1 rounded-lg border border-border/40 bg-card/60 px-2 py-2 text-sm focus:ring-2 focus:ring-accent transition-all duration-320"
                                        >
                                            <option value="menit">Menit</option>
                                            <option value="jam">Jam</option>
                                            <option value="hari">Hari</option>
                                        </select>
                                    </div>
                                    {/* Budget */}
                                    <InputField
                                        label="Budget (opsional)"
                                        value={form.budget}
                                        onChange={handleBudgetRaw}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Rp 100.000"
                                        inputMode="numeric"
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="detail"
                                    variants={fadeSlide(reduceMotion)}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="space-y-3"
                                >
                                    <InputField
                                        label="Judul"
                                        value={form.title}
                                        onChange={(v) => setField("title", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Contoh: Desain Logo Brand"
                                        required
                                    />
                                    <TextAreaField
                                        label="Deskripsi"
                                        value={form.description}
                                        onChange={(v) => setField("description", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Ceritakan detail pekerjaanmu"
                                        rows={4}
                                    />
                                    <InputField
                                        label="Kategori"
                                        value={form.category}
                                        onChange={(v) => setField("category", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Design, IT, dll"
                                    />
                                    <InputField
                                        label="Skill (comma)"
                                        value={form.skills}
                                        onChange={(v) => setField("skills", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="React, Figma"
                                    />
                                    <InputField
                                        label="Budget"
                                        value={form.budget}
                                        onChange={handleBudgetRaw}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Rp 1.000.000"
                                        inputMode="numeric"
                                    />
                                    <InputField
                                        label="Deadline"
                                        type="date"
                                        value={form.deadline}
                                        onChange={(v) => setField("deadline", v)}
                                    />
                                    <InputField
                                        label="Lokasi (opsional)"
                                        value={form.location}
                                        onChange={(v) => setField("location", v)}
                                        onPaste={handlePasteBlockLinks}
                                        placeholder="Jakarta Selatan"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Payment */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-foreground/85">Metode Pembayaran</p>
                            <PaymentMethodPills value={payment} onChange={setPayment} size="sm" />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow hover:scale-[1.01] active:scale-[0.99] transition-all duration-320"
                            disabled={!canSubmit || submitting}
                        >
                            {submitting ? "Mengirim..." : "Tinjau & Pasang"}
                        </Button>
                        <p className="text-[11px] text-muted-foreground">
                            Dengan memposting, Anda menyetujui{" "}
                            <span className="text-accent font-medium">Syarat & Ketentuan</span>.
                        </p>
                    </form>

                    {/* Review Sheet */}
                    <PostReviewSheet
                        open={showReview}
                        onOpenChange={setShowReview}
                        data={{
                            title: form.title,
                            description: form.description,
                            category: form.category,
                            skills: form.skills,
                            budget: form.budget,
                            duration: `${form.durationValue || ""} ${form.durationUnit}`,
                            payment,
                            deadline: form.deadline,
                            location: form.location,
                        }}
                        onConfirm={doSubmit}
                    />
                </section>
            </div>
        </div>
    );
}

/* ---------------- helper components ---------------- */
const InputField = ({ label, type = "text", ...props }) => (
    <div>
        <label className="block text-xs font-medium mb-1 text-foreground/85">{label}</label>
        <input type={type} {...props} className={baseInput} />
    </div>
);

const TextAreaField = ({ label, rows = 3, ...props }) => (
    <div>
        <label className="block text-xs font-medium mb-1 text-foreground/85">{label}</label>
        <textarea rows={rows} {...props} className={baseInput + " resize-none"} />
    </div>
);

const ToggleButtonCompact = React.memo(({ active, onClick, icon, label }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover-card ${active ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
        aria-pressed={active}
    >
        {icon}
        <span>{label}</span>
    </button>
));
