import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getLogoUrl } from '../services/logoService';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const Auth: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Carrega o logo dinâmico
    useEffect(() => {
        getLogoUrl().then(url => setLogoUrl(url));
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setSuccessMessage('Login feito com sucesso! Entrando...');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setSuccessMessage('Cadastro feito com sucesso! Vá para seu e-mail e clique no link para confirmar.');
            }
        } catch (error: any) {
            let msg = error.message;
            if (msg.includes('Email not confirmed')) {
                msg = 'Vá para seu e-mail para confirmar a conta! O Crentify te enviou um link de liberação de acesso.';
            } else if (msg.includes('Invalid login credentials')) {
                msg = 'E-mail ou senha inválidos. Tente novamente.';
            } else if (msg.includes('User already registered')) {
                msg = 'Esse e-mail já possui cadastro. Por favor, clique em "Faça login" lá embaixo.';
            } else if (msg.includes('Password should be at least')) {
                msg = 'Sua senha deve ter no mínimo 6 caracteres.';
            }
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-brand-bg flex justify-center p-4 relative overflow-y-auto">
            {/* Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md z-10 my-auto py-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Banner de Aviso Crentify Hábitos */}
                    <div className="bg-[#4D9DE0]/10 border border-[#4D9DE0]/30 p-4 rounded-xl mb-8 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#4D9DE0]/5 group-hover:bg-[#4D9DE0]/10 transition-colors" />
                        <p className="text-[#4D9DE0] text-sm font-medium mb-3 relative z-10">
                            Procurando pelo <strong className="text-white">Crentify Hábitos</strong>? <br />
                            Ele mudou de endereço!
                        </p>
                        <a 
                            href="https://habitos.crentify.app/" 
                            className="relative z-10 inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#4D9DE0]/20 hover:bg-[#4D9DE0]/40 border border-[#4D9DE0]/50 text-white font-semibold rounded-lg transition-all text-sm shadow-lg"
                        >
                            Acessar habitos.crentify.app
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="CRENTIFY Logo"
                                    className="relative w-20 h-20 object-contain rounded-xl"
                                    style={{ filter: 'saturate(1.5) brightness(1.15) hue-rotate(-10deg)' }}
                                    onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                />
                            ) : (
                                <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-brand animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                        </h1>
                        <p className="text-gray-400">
                            {isLogin
                                ? 'Entre para acessar seu devocional'
                                : 'Comece sua jornada espiritual hoje'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
                                    placeholder="Seu email"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
                                    placeholder="Sua senha"
                                    required
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Entrar' : 'Cadastrar'}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
                                disabled={isLoading}
                            >
                                {isLogin ? 'Cadastre-se' : 'Faça login'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
