import React, { memo } from "react";

const SkipLink = memo(() => (
    <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-lg"
    >
        Lompat ke konten
    </a>
));

SkipLink.displayName = 'SkipLink';
export default SkipLink;