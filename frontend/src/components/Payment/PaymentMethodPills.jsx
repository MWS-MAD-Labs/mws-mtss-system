// src/components/Payment/PaymentMethodPills.jsx
import React from "react";
import { WalletMinimal, HandCoins, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PaymentMethodPills
 * - Compact, token-driven segmented control for selecting payment methods
 * - Use in PostJob, Wallet, Offers flow
 *
 * Props:
 * - value: "wallet" | "cash" | "card" (optional)
 * - onChange: (method: string) => void
 * - options?: array to override [{key: 'cash'|'wallet'|'card', label, icon}]
 * - className?: string
 * - size?: "sm" | "md"
 */
export default function PaymentMethodPills({
    value,
    onChange,
    options,
    className = "",
    size = "md",
}) {
    const pills =
        options ||
        [
            { key: "cash", label: "Tunai", icon: HandCoins },
            { key: "wallet", label: "Saldo", icon: WalletMinimal },
        ];

    const isSm = size === "sm";

    return (
        <div
            className={cn(
                "inline-flex w-full gap-2 rounded-xl bg-card/40 p-1 backdrop-blur-xl ring-1 ring-border",
                className
            )}
            role="tablist"
            aria-label="Metode Pembayaran"
        >
            {pills.map((p) => {
                const Icon = p.icon;
                const active = value === p.key;
                return (
                    <button
                        key={p.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange?.(p.key)}
                        className={cn(
                            "flex-1 rounded-lg transition-colors duration-300 hover:text-foreground hover:bg-card/60",
                            active ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"
                        )}
                    >
                        <span className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5">
                            <Icon className={cn(isSm ? "h-3.5 w-3.5" : "h-4 w-4")} />
                            <span className={cn("font-medium", isSm ? "text-xs" : "text-sm")}>{p.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}