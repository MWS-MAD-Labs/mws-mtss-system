import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
    // Base: liquid-glass friendly, premium transitions, accessible rings
    'inline-flex items-center justify-center rounded-xl text-sm font-medium ' +
    'transition-[color,background-color,border-color,box-shadow,transform,opacity] ' +
    'mtss-duration-soft mtss-ease-soft hover-card ' +
    'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-border bg-card/80 text-foreground hover:bg-accent/15 hover:text-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
                ghost: 'text-foreground hover:bg-secondary/30',
                link: 'text-accent underline-offset-4 hover:underline hover:text-accent/80',
                // Premium gradient primary using tokens
                gradient: 'bg-gradient-to-r from-primary via-gold to-accent text-primary-foreground hover:opacity-95',
                // Glass button for subtle surfaces
                glass:
                    'border border-border/40 bg-card/50 backdrop-blur-xl text-foreground ' +
                    'hover:bg-secondary/40 hover:text-foreground',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-lg px-3',
                lg: 'h-11 rounded-xl px-6',
                icon: 'h-10 w-10',
                // Compact mobile-focused sizes
                xs: 'h-8 rounded-lg px-2.5 py-1.5 text-xs',
                compact: 'h-8 rounded-lg px-2 text-xs',
                'icon-sm': 'h-8 w-8 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
