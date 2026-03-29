import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event so it can be triggered later
            setInstallPrompt(e as BeforeInstallPromptEvent);
            console.log('💾 PWA install prompt ready');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detect if app was installed
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA was installed');
            setIsInstalled(true);
            setInstallPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const promptInstall = async () => {
        if (!installPrompt) {
            console.log('⚠️ No install prompt available');
            return false;
        }

        // Show the install prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            setInstallPrompt(null);
            return true;
        } else {
            console.log('❌ User dismissed the install prompt');
            return false;
        }
    };

    return {
        installPrompt,
        isInstalled,
        promptInstall,
        canInstall: !!installPrompt && !isInstalled
    };
};
