import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-brand-bg text-white flex flex-col items-center justify-center p-4">
                    <h1 className="text-3xl font-bold mb-4 text-red-500">Ops, algo deu errado.</h1>
                    <p className="mb-4 text-c-text-secondary">Por favor, recarregue a página ou tente novamente mais tarde.</p>
                    <pre className="bg-black/30 p-4 rounded text-sm text-red-400 max-w-lg overflow-auto">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-brand rounded-lg hover:bg-brand/80 transition-colors"
                    >
                        Recarregar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
