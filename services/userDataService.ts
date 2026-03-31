import { supabase } from './supabaseClient';

export interface UserDataRecord {
    key: string;
    value: any;
}

/**
 * Loads user data records from Supabase.
 * If userId is provided, loads data for that specific user (for shared data).
 * Otherwise loads for the current logged in user.
 */
export const loadUserData = async (userId?: string): Promise<Record<string, { value: any, updated_at: string }>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user && !userId) return {};

    const targetUserId = userId || session?.user?.id;
    if (!targetUserId) return {};

    const { data, error } = await supabase
        .from('user_data')
        .select('key, value, updated_at')
        .eq('user_id', targetUserId);

    if (error) {
        console.error(`❌ Erro ao carregar dados do usuário ${targetUserId}:`, error);
        throw error; // Lançar o erro para que o chamador saiba que falhou
    }

    const userData: Record<string, { value: any, updated_at: string }> = {};
    if (data) {
        data.forEach((item) => {
            userData[item.key] = {
                value: item.value,
                updated_at: item.updated_at
            };
        });
    }
    return userData;
};

/**
 * Loads shared data that is visible to all authenticated users.
 * This normally includes content uploaded by admins.
 */
export const loadSharedData = async (adminEmails: string[]): Promise<Record<string, any>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return {};

    console.log("🔍 Buscando IDs dos administradores para carregar dados compartilhados...");
    
    // Primeiro, encontramos os IDs de todos os admins
    const { data: adminProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', adminEmails);

    if (profileError) {
        console.error("❌ Erro ao buscar perfis de administradores. Verifique se a tabela 'profiles' existe:", profileError);
    }

    const adminIds = adminProfiles?.map(p => p.id) || [];
    
    if (adminIds.length === 0) {
        console.warn("⚠️ Nenhum ID de administrador encontrado na tabela 'profiles'. Certifique-se de executar o script SQL de correção.");
    }

    // Se não encontramos o sermoes.mensagens@gmail.com na lista por algum motivo, 
    // mas o usuário atual é admin, tentamos carregar de qualquer admin que tenha dados
    const { data, error } = await supabase
        .from('user_data')
        .select('key, value, updated_at, user_id')
        .in('key', [
            'crentify_bible_data', 
            'crentify_bible_progress', 
            'crentify_academy_content', 
            'crentify_academy_categories', 
            'crentify_academy_courses',
            'crentify_academy_weeks',
            'crentify_academy_days'
        ])
        .in('user_id', adminIds) // Filtramos pelos IDs dos administradores descobertos
        .order('updated_at', { ascending: false });

    if (error) {
        console.error(`❌ Erro ao buscar dados compartilhados:`, error);
        throw error;
    }

    const sharedData: Record<string, any> = {};
    if (data) {
        console.log(`📋 Encontrados ${data.length} registros no total para chaves compartilhadas.`);
        
        // Helper to check if value is effectively "empty" (empty array)
        const isEmpty = (val: any) => Array.isArray(val) && val.length === 0;

        // Group by key and find the best one
        data.forEach((item) => {
            if (!sharedData[item.key]) {
                // If the latest is empty, we keep looking for a non-empty one further down the (ordered) list
                if (isEmpty(item.value)) {
                    const betterRecord = data.find(d => d.key === item.key && !isEmpty(d.value));
                    if (betterRecord) {
                        sharedData[item.key] = betterRecord.value;
                        console.log(`✅ Chave [${item.key}] carregada (Recuperada de versão anterior)`);
                    } else {
                        sharedData[item.key] = item.value;
                    }
                } else {
                    sharedData[item.key] = item.value;
                    console.log(`✅ Chave [${item.key}] carregada (Versão: ${item.updated_at})`);
                }
            }
        });
    }

    if (Object.keys(sharedData).length === 0) {
        console.warn("⚠️ Nenhum dado compartilhado foi retornado. Provavelmente bloqueado por RLS. Execute o SQL de correção.");
    }

    return sharedData;
};


/**
 * Saves a specific key-value pair to Supabase.
 * Upserts the record (insert or update).
 * If ownerId is provided, attempts to save to that user's record (requires editor permission).
 */
export const saveUserData = async (key: string, value: any, ownerId?: string): Promise<string | undefined> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        console.warn('Cannot save user data: No active session');
        return;
    }

    const updatedAt = new Date().toISOString();
    const { error } = await supabase
        .from('user_data')
        .upsert({
            user_id: ownerId || session.user.id,
            key,
            value,
            updated_at: updatedAt
        });

    if (error) {
        console.error(`❌ Erro ao salvar dados para a chave "${key}":`, error);
        throw error;
    }

    return updatedAt;
};

