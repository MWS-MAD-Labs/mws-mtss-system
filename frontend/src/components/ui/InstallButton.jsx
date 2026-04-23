import { memo, useState, useEffect } from "react";
import { Download } from "lucide-react";

const InstallButton = memo(() => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if running on iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Always show button for iOS, or wait for beforeinstallprompt for others
        if (iOS) {
            setIsVisible(true);
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            setIsInstallable(true);
            setIsVisible(true);
        };

        // Listen for successful app installation
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsVisible(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if already installed (basic check)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Fallback for iOS or when prompt is not available
            if (isIOS) {
                alert('To install this app on iOS: tap the share button and select "Add to Home Screen"');
            } else {
                alert('App installation is not available on this device');
            }
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // Reset the deferred prompt
        setDeferredPrompt(null);

        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
    };

    // Don't show button if not visible
    if (!isVisible) {
        return null;
    }

    return (
        <button
            onClick={handleInstallClick}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium"
            aria-label="Install MWS IntegraLearn App"
        >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">
                {isIOS ? 'Add to Home Screen' : 'Install App'}
            </span>
            <span className="sm:hidden">Install</span>
        </button>
    );
});

InstallButton.displayName = 'InstallButton';

export default InstallButton;