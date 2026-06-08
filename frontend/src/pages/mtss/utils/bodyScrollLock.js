let lockCount = 0;
let previousStyles = null;

export const lockBodyScroll = () => {
    if (typeof document === "undefined") return () => {};

    if (lockCount === 0) {
        previousStyles = {
            overflow: document.body.style.overflow,
            overscrollBehavior: document.body.style.overscrollBehavior,
            touchAction: document.body.style.touchAction,
        };
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        document.body.style.touchAction = "none";
    }

    lockCount += 1;
    let released = false;

    return () => {
        if (released) return;
        released = true;
        lockCount = Math.max(0, lockCount - 1);

        if (lockCount === 0 && previousStyles) {
            document.body.style.overflow = previousStyles.overflow;
            document.body.style.overscrollBehavior = previousStyles.overscrollBehavior;
            document.body.style.touchAction = previousStyles.touchAction;
            previousStyles = null;
        }
    };
};
