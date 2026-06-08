let staffRoutePrefetchPromise = null;
let studentRoutePrefetchPromise = null;
let visionStackPrefetchPromise = null;

const runWhenIdle = (task) => {
    if (typeof window === 'undefined') {
        task();
        return;
    }

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => task(), { timeout: 1200 });
        return;
    }

    setTimeout(task, 180);
};

const prefetchVisionStack = () => {
    if (!visionStackPrefetchPromise) {
        visionStackPrefetchPromise = import('@/services/faceDetectionService')
            .then((mod) => mod.preloadVisionStack?.())
            .catch((error) => {
                visionStackPrefetchPromise = null;
                throw error;
            });
    }

    return visionStackPrefetchPromise;
};

export const prefetchStaffFaceScanOnIntent = () => {
    if (!staffRoutePrefetchPromise) {
        staffRoutePrefetchPromise = import('@/pages/VerificationPage').catch((error) => {
            staffRoutePrefetchPromise = null;
            throw error;
        });
    }

    runWhenIdle(() => {
        prefetchVisionStack().catch(() => {
            // best effort only
        });
    });

    return staffRoutePrefetchPromise;
};

export const prefetchStudentFaceScanOnIntent = () => {
    if (!studentRoutePrefetchPromise) {
        studentRoutePrefetchPromise = import('@/pages/StudentFaceScanPage').catch((error) => {
            studentRoutePrefetchPromise = null;
            throw error;
        });
    }

    runWhenIdle(() => {
        prefetchVisionStack().catch(() => {
            // best effort only
        });
    });

    return studentRoutePrefetchPromise;
};
