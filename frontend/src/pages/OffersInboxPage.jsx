// src/pages/OffersInboxPage.jsx
import React, { useMemo, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, User, Wallet } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { fmtCurrency } from "@/lib/utils";
import { DepositPromptBanner } from "@/components/Banners/KYCStatusBanner";
import NegotiationModal from "@/components/NegotiationModal";
import DepositSheet from "@/components/Sheets/DepositSheet";
import EmptyState from "@/components/feedback/EmptyState";

/**
 * OffersInboxPage (Client) — review and manage offers for posted jobs.
 * - Mobile-first compact layout with liquid glass effect
 * - Token-driven colors, smooth 320ms motion
 * - Dummy data for demo (replace with API/JobContext in real app)
 */

const DURATION = 0.32;

const seedOffers = [
    {
        id: "OFF-001",
        jobId: "JOB-2025-0901-01",
        jobTitle: "Antar paket kecil",
        worker: { name: "Rifqi H", rating: 4.7, initials: "R" },
        message: "Siap ambil dalam 15 menit.",
        amount: 25000,
        time: "10m ago",
        status: "pending",
        payment: "cash",
    },
    {
        id: "OFF-002",
        jobId: "JOB-2025-0831-04",
        jobTitle: "Bantu pasang galon",
        worker: { name: "Sinta A", rating: 4.9, initials: "S" },
        message: "Bisa sekarang, lokasi dekat.",
        amount: 18000,
        time: "25m ago",
        status: "pending",
        payment: "wallet",
    },
    {
        id: "OFF-003",
        jobId: "JOB-2025-0830-02",
        jobTitle: "Bersih-bersih kamar",
        worker: { name: "Ucup", rating: 4.5, initials: "U" },
        message: "Perkiraan selesai 2 jam.",
        amount: 65000,
        time: "1h ago",
        status: "accepted",
        payment: "wallet",
    },
];

function Pill({ children, className = "" }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
            {children}
        </span>
    );
}

const OfferCard = React.memo(function OfferCard({ offer, onAccept, onReject, onNegotiate }) {
    const isAccepted = offer.status === "accepted";
    return (
        <Card className="rounded-2xl border border-border/50 glass-strong hover-card">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground ring-1 ring-accent/30 shadow-sm">
                            {offer.worker.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{offer.jobTitle}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {offer.worker.name} • ★ {offer.worker.rating} • {offer.time}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Pill className="bg-secondary/30 text-foreground/80">
                                    <Wallet className="h-3.5 w-3.5 mr-1" />
                                    {offer.payment === "cash" ? "Cash" : "Wallet"}
                                </Pill>
                                {isAccepted ? (
                                    <Pill className="bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        Accepted
                                    </Pill>
                                ) : (
                                    <Pill className="bg-primary/15 text-primary ring-1 ring-primary/25">
                                        Negotiate
                                    </Pill>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-2 text-sm text-foreground/90 leading-snug">{offer.message}</p>

                <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="text-sm font-bold text-foreground">{fmtCurrency(offer.amount)}</div>
                    <div className="flex gap-2">
                        {!isAccepted ? (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl px-3 py-1.5 text-xs hover:text-accent hover:border-accent"
                                    onClick={() => onReject(offer.id)}
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl px-3 py-1.5 text-xs hover:text-accent hover:border-accent"
                                    onClick={() => onNegotiate(offer)}
                                >
                                    Negosiasi
                                </Button>
                                <Button
                                    size="sm"
                                    className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs hover:bg-primary/90"
                                    onClick={() => onAccept(offer.id)}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Pilih
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1.5 text-xs"
                                asChild
                            >
                                <Link to={`/job/${offer.jobId}/track`}>Lacak</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

export default function OffersInboxPage() {
    const reduce = useReducedMotion();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Deposit sheet state (demo escrow suggestion)
    const [depositOpen, setDepositOpen] = useState(false);
    const [depositCtx, setDepositCtx] = useState({ amount: 0, jobId: null });

    const [tab, setTab] = useState("all"); // all | pending | accepted
    const [offers, setOffers] = useState(seedOffers);

    // Negotiation modal state
    const [openNegotiate, setOpenNegotiate] = useState(false);
    const [selected, setSelected] = useState(null);
    const [negotiations, setNegotiations] = useState({}); // id -> offers[]

    const filtered = useMemo(() => {
        if (tab === "pending") return offers.filter((o) => o.status === "pending");
        if (tab === "accepted") return offers.filter((o) => o.status === "accepted");
        return offers;
    }, [offers, tab]);

    const onAccept = useCallback(
        (id) => {
            const target = offers.find((o) => o.id === id);
            setOffers((s) => s.map((o) => (o.id === id ? { ...o, status: "accepted" } : o)));
            toast({ title: "Penawaran dipilih", description: "Pekerja akan segera memulai." });

            if (!target) return;
            const goTrack = () => setTimeout(() => navigate(`/job/${target.jobId}/track`), 10);

            // Use DepositSheet instead of confirm for high-value cash jobs
            if (target.payment === "cash" && (target.amount || 0) >= 300000) {
                setDepositCtx({ amount: target.amount, jobId: target.jobId });
                setDepositOpen(true);
            } else if (target?.jobId) {
                goTrack();
            }
        },
        [offers, toast, navigate]
    );

    const onReject = useCallback(
        (id) => {
            setOffers((s) => s.filter((o) => o.id !== id));
            toast({ title: "Offer rejected", description: "Offer removed from list." });
        },
        [toast]
    );

    const onNegotiate = useCallback((offer) => {
        setSelected(offer);
        setNegotiations((prev) => ({ ...prev, [offer.id]: prev[offer.id] || [] }));
        setOpenNegotiate(true);
    }, []);

    const addOffer = useCallback(
        (amount, byRole) => {
            if (!selected) return;
            setNegotiations((prev) => {
                const list = prev[selected.id] || [];
                const entry = { id: Date.now(), amount: Number(amount), by: byRole, status: "pending", createdAt: Date.now() };
                return { ...prev, [selected.id]: [entry, ...list] };
            });
        },
        [selected]
    );

    const acceptCounter = useCallback(() => {
        if (!selected) return;

        const agreed = negotiations[selected.id]?.[0]?.amount ?? selected.amount;
        setOffers((s) =>
            s.map((o) =>
                o.id === selected.id ? { ...o, status: "accepted", amount: agreed } : o
            )
        );
        setOpenNegotiate(false);
        toast({ title: "Price accepted", description: "Offer accepted. Proceeding." });

        const goTrack = () => selected.jobId && setTimeout(() => navigate(`/job/${selected.jobId}/track`), 10);

        // Use DepositSheet instead of confirm for high-value cash jobs
        if (selected.payment === "cash" && (agreed || 0) >= 300000) {
            setDepositCtx({ amount: agreed, jobId: selected.jobId });
            setDepositOpen(true);
        } else {
            goTrack();
        }
    }, [selected, negotiations, toast, navigate]);

    const fade = {
        hidden: { opacity: 0, y: reduce ? 0 : 12 },
        show: { opacity: 1, y: 0, transition: { duration: DURATION } },
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Penawaran — Kerjain</title>
            </Helmet>

            <div className="relative mx-auto min-h-dvh w-full max-w-lg px-3 sm:px-4 py-4 sm:py-6">
                {/* Header */}
                <motion.div variants={fade} initial="hidden" animate="show" className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to={-1} aria-label="Back">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-card/30 backdrop-blur-md hover:bg-card/50 transition-colors duration-300"
                            >
                                <ArrowLeft className="h-5 w-5 text-foreground" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-base sm:text-lg font-semibold text-foreground">Penawaran</h1>
                            <p className="text-[11px] sm:text-xs text-muted-foreground">Kelola tawaran untuk pekerjaan Anda</p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full px-2 py-1 text-xs hover:bg-accent/10 hover:text-accent"
                            onClick={() => setTab("all")}
                            aria-pressed={tab === "all"}
                        >
                            Semua
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full px-2 py-1 text-xs hover:bg-accent/10 hover:text-accent"
                            onClick={() => setTab("pending")}
                            aria-pressed={tab === "pending"}
                        >
                            Menunggu
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full px-2 py-1 text-xs hover:bg-accent/10 hover:text-accent"
                            onClick={() => setTab("accepted")}
                            aria-pressed={tab === "accepted"}
                        >
                            Dipilih
                        </Button>
                    </div>
                </motion.div>

                {/* Tabs (mobile) */}
                <div className="sm:hidden mb-3 inline-flex w-full rounded-xl bg-card/40 p-1 backdrop-blur-xl ring-1 ring-border">
                    {[
                        { key: "all", label: "All" },
                        { key: "pending", label: "Pending" },
                        { key: "accepted", label: "Accepted" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            aria-pressed={tab === t.key}
                            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === t.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <motion.div variants={fade} initial="hidden" animate="show">
                    {filtered.length === 0 ? (
                        <div className="mt-8">
                            <EmptyState
                                icon={<User className="h-6 w-6" />}
                                title="No offers yet"
                                subtitle="Penawaran akan muncul di sini."
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((o) => (
                                <OfferCard key={o.id} offer={o} onAccept={onAccept} onReject={onReject} onNegotiate={onNegotiate} />
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Deposit banner for high-value cash jobs */}
                <div className="mt-4">
                    <DepositPromptBanner
                        show={filtered.some((o) => o.payment === "cash" && o.amount >= 300000)}
                        thresholdIDR={300000}
                        estimateIDR={filtered.find((o) => o.payment === "cash")?.amount || 0}
                        onDeposit={() => toast({ title: "Deposit (demo)", description: "Jalankan alur deposit." })}
                    />
                </div>

                {/* Negotiation Modal (Client) */}
                {selected && (
                    <NegotiationModal
                        isOpen={openNegotiate}
                        onClose={() => setOpenNegotiate(false)}
                        jobFee={selected.amount}
                        role="client"
                        initialOffers={negotiations[selected.id] || []}
                        onSendOffer={(amt) => addOffer(amt, "client")}
                        onAccept={(offer) => {
                            setOffers((s) =>
                                s.map((o) =>
                                    o.id === selected.id
                                        ? { ...o, status: "accepted", amount: offer?.amount || o.amount }
                                        : o
                                )
                            );
                            setOpenNegotiate(false);
                            toast({ title: "Price accepted", description: "Offer accepted. Proceeding." });

                            const agreed = offer?.amount || selected.amount;
                            if (selected.payment === "cash" && (agreed || 0) >= 300000) {
                                setDepositCtx({ amount: agreed, jobId: selected.jobId });
                                setDepositOpen(true);
                            } else if (selected.jobId) {
                                setTimeout(() => navigate(`/job/${selected.jobId}/track`), 10);
                            }
                        }}
                        onReject={() => {
                            // keep modal open; external state not mutated on reject in this demo
                        }}
                    />
                )}
            </div>

            {/* Deposit Sheet (demo) */}
            <DepositSheet
                open={depositOpen}
                onOpenChange={setDepositOpen}
                amount={depositCtx.amount}
                onWallet={() => {
                    setDepositOpen(false);
                    navigate("/wallet");
                }}
                onContinue={() => {
                    setDepositOpen(false);
                    if (depositCtx.jobId) navigate(`/job/${depositCtx.jobId}/track`);
                }}
            />
        </AnimatedPage>
    );
}

// Helper: IDR currency (fallback if not imported)
function _fmt(n = 0) {
    try {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
    } catch {
        return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
    }
}
