import { memo } from "react";

const GridPattern = memo(() => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] md:bg-[size:6rem_6rem] opacity-[0.03]" />
    </div>
));

GridPattern.displayName = 'GridPattern';

export default GridPattern;