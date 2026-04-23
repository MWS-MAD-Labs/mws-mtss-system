import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold " +
    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background",
    {
        variants: {
            variant: {
                default: "border-primary/30 bg-primary/15 text-primary hover:bg-primary/25",
                secondary: "border-secondary/30 bg-secondary/15 text-secondary hover:bg-secondary/25",
                accent: "border-accent/30 bg-accent text-accent-foreground hover:bg-accent/90",
                destructive: "border-destructive/40 bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border-border text-foreground hover:bg-card/50",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
