import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
import { saveUserData } from '../services/userDataService';

const DEBOUNCE_MS = 1500;

/**
 * Hook to automatically save state to Supabase when it changes.
 * Debounced to prevent excessive API calls.
 */
export const useDataSync = (key: string, value: any, ownerId?: string) => {
    const { user } = useAuth();
    const { hasFetchError, isDataLoaded } = useDataContext(); // Pega o estado de erro do carregamento
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const firstRender = useRef(true);
    const previousValue = useRef<any>(null);

    useEffect(() => {
        if (!user || !key) return;

        // 🛡️ PROTEÇÃO CRÍTICA: Se houve erro no carregamento, NUNCA sincronizamos local -> nuvem
        // Isso evita sobrescrever dados bons com o estado vazio/padrão do app que falhou ao carregar
        if (hasFetchError) {
            console.warn(`🛡️ PROTEÇÃO: Sincronização bloqueada para "${key}" devido a erro de carregamento anterior.`);
            return;
        }

        // 🛡️ PROTEÇÃO: Se os dados ainda não terminaram de carregar, não sincronizamos
        if (!isDataLoaded) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (firstRender.current) {
            firstRender.current = false;

            // Verificamos se há modificações locais pendentes de sincronização
            const lastSyncedAt = localStorage.getItem(`${key}_last_synced_at`) || '0';
            const lastModifiedAt = localStorage.getItem(`${key}_last_modified_at`) || '0';

            const isLocalNewer = new Date(lastModifiedAt).getTime() > new Date(lastSyncedAt).getTime();

            if (!isLocalNewer) {
                previousValue.current = value;
                return;
            }

            console.log(`📡 [${key}] Detectadas modificações locais pendentes na inicialização. Aguardando interação do usuário.`);
            // IMPORTANTE: Se o local for mais novo, não podemos deixar o 'value' atual (que é o da nuvem, antigo)
            // disparar uma sincronização, pois isso sobrescreveria o local mais novo com dados velhos da nuvem.
            // Definimos previousValue.current = value para que o JSON.stringify(previousValue.current) === JSON.stringify(value)
            // seja verdadeiro e ele não sincronize nada até que o usuário faça uma NOVA alteração local.
            previousValue.current = value;
            return;
        }

        // A proteção de hasFetchError acima já é suficiente para evitar sobrescrever a nuvem com dados vazios
        // por falha de carregamento. Não precisamos mais da trava de length > 0 && length === 0,
        // pois ela impedia o usuário de deletar o último item de uma lista.
        
        if (JSON.stringify(previousValue.current) === JSON.stringify(value)) {
            return;
        }

        // Marcar como modificado localmente
        const now = new Date().toISOString();
        localStorage.setItem(`${key}_last_modified_at`, now);

        // Backup local antes de tentar salvar na nuvem
        const backupKey = `${key}_last_good_version`;
        try {
            localStorage.setItem(backupKey, JSON.stringify({
                timestamp: now,
                data: value
            }));
        } catch (e) { /* ignore */ }

        timeoutRef.current = setTimeout(() => {
            const dataSize = JSON.stringify(value).length;
            console.log(`💾 Sincronizando "${key}" (${(dataSize / 1024).toFixed(2)} KB)...`);

            saveUserData(key, value, ownerId)
                .then((serverTimestamp) => {
                    if (serverTimestamp) {
                        console.log(`✅ "${key}" sincronizado.`);
                        previousValue.current = value;
                        localStorage.setItem(`${key}_last_synced_at`, serverTimestamp);
                        // Ao sincronizar com sucesso, o tempo de modificação local 
                        // deve ser igual ou anterior ao tempo de sincronização
                        localStorage.setItem(`${key}_last_modified_at`, serverTimestamp);
                    }
                })
                .catch(err => {
                    console.error(`❌ Falha ao sincronizar "${key}":`, err);
                    if (dataSize > 1024 * 1024) {
                        console.error(`⚠️ ATENÇÃO: O tamanho dos dados para "${key}" é muito grande (${(dataSize / 1024 / 1024).toFixed(2)} MB). Isso pode exceder os limites do Supabase/Postgres.`);
                    }
                });
        }, DEBOUNCE_MS);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [value, key, user, ownerId]);
};
