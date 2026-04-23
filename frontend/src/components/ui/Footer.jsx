import { memo } from "react";

const Footer = memo(() => (
    <footer className="relative border-t border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 md:py-6">
            <p className="text-[10px] md:text-xs text-center text-muted-foreground">
                © {new Date().getFullYear()} Millennia World School. All rights reserved.
            </p>
        </div>
    </footer>
));

Footer.displayName = 'Footer';

export default Footer;