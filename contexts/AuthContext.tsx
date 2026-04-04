import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    created_at?: string;
    updated_at?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updatePassword: (newPassword: string) => Promise<{ error: any }>;
    updateProfile: (data: Partial<UserProfile>) => Promise<{ error: any }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
        }).catch((err) => {
            console.error("Unexpected error during auth initialization:", err);
        }).finally(() => {
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Carregar perfil completo do Supabase quando o usuário loga
    const loadProfile = useCallback(async (userId: string, email: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            setProfile(data as UserProfile);
        } else {
            // Perfil não existe ainda — criar via upsert
            const newProfile: UserProfile = {
                id: userId,
                email,
                full_name: user?.user_metadata?.full_name || email.split('@')[0],
                updated_at: new Date().toISOString()
            };
            await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
            setProfile(newProfile);
        }
    }, [user]);

    useEffect(() => {
        if (session?.user?.id && session?.user?.email) {
            loadProfile(session.user.id, session.user.email);
        } else {
            setProfile(null);
        }
    }, [session]);

    const refreshProfile = useCallback(async () => {
        if (session?.user?.id && session?.user?.email) {
            await loadProfile(session.user.id, session.user.email);
        }
    }, [session, loadProfile]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const updatePassword = async (newPassword: string) => {
        return await supabase.auth.updateUser({ password: newPassword });
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!session?.user?.id) return { error: 'Não autenticado' };
        const { error } = await supabase
            .from('profiles')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', session.user.id);
        if (!error) {
            setProfile(prev => prev ? { ...prev, ...data } : null);
        }
        return { error };
    };

    return (
        <AuthContext.Provider value={{
            session, user, profile, loading,
            signOut, updatePassword, updateProfile, refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
