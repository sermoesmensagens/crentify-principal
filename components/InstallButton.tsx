import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { X } from 'lucide-react';

export const InstallButton = () => {
    const { canInstall, promptInstall, isInstalled } = useInstallPrompt();
    const [showManualInstructions, setShowManualInstructions] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    // Don't show if already installed or user dismissed
    if (isInstalled || isDismissed) {
        return null;
    }

    const handleClick = () => {
        if (canInstall) {
            promptInstall();
        } else {
            // Show manual installation instructions
            setShowManualInstructions(true);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        setShowManualInstructions(false);
    };

    return (
        <>
            {/* Install Button */}
            <button
                onClick={handleClick}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 neon-glow"
                aria-label="Instalar aplicativo"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m0 0l-4-4m4 4l4-4M3 20h18"
                    />
                </svg>
                <span>Instalar App</span>
            </button>

            {/* Manual Installation Instructions Modal */}
            {showManualInstructions && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#161b22] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowManualInstructions(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-4">
                            Como Instalar o App
                        </h3>

                        <div className="space-y-4 text-gray-300">
                            <div>
                                <h4 className="font-semibold text-purple-400 mb-2">Chrome/Edge (Desktop):</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Clique no ícone <strong>⋮</strong> (três pontos) no canto superior direito</li>
                                    <li>Selecione <strong>"Instalar CRENTIFY"</strong> ou <strong>"Adicionar a página inicial"</strong></li>
                                    <li>Confirme a instalação</li>
                                </ol>
                            </div>

                            <div>
                                <h4 className="font-semibold text-purple-400 mb-2">Chrome (Android):</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Toque no ícone <strong>⋮</strong> no canto superior direito</li>
                                    <li>Selecione <strong>"Adicionar à tela inicial"</strong></li>
                                    <li>Toque em <strong>"Adicionar"</strong></li>
                                </ol>
                            </div>

                            <div>
                                <h4 className="font-semibold text-purple-400 mb-2">Safari (iOS):</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Toque no ícone de <strong>compartilhar</strong> (□↑)</li>
                                    <li>Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong></li>
                                    <li>Toque em <strong>"Adicionar"</strong></li>
                                </ol>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowManualInstructions(false)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                            >
                                Não mostrar novamente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
