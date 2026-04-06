import { supabase } from './supabaseClient';

const BUCKET_NAME = 'app-assets';
const LOGO_PATH = 'logo/main-logo.png';
const FALLBACK_LOGO = '/favicon.png';

/**
 * Busca a URL pública do logo do Supabase Storage
 * Se não existir, o componente lidará com o fallback no seu respectivo onError
 */
export const getLogoUrl = async (): Promise<string> => {
    try {
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(LOGO_PATH);

        if (data?.publicUrl) {
            // Adiciona timestamp para evitar cache
            return `${data.publicUrl}?t=${Date.now()}`;
        }
    } catch (error) {
        console.log('Logo não encontrado no Supabase, usando fallback local');
    }

    return FALLBACK_LOGO;
};

/**
 * Faz upload de um novo logo para o Supabase Storage
 * @param file - Arquivo de imagem do logo
 * @returns URL pública do logo ou null em caso de erro
 */
export const uploadLogo = async (file: File): Promise<string | null> => {
    try {
        // Remove logo antigo se existir
        await supabase.storage.from(BUCKET_NAME).remove([LOGO_PATH]);

        // Faz upload do novo logo
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(LOGO_PATH, file, {
                cacheControl: '0',
                upsert: true,
                contentType: file.type
            });

        if (error) {
            console.error('Erro ao fazer upload do logo:', error);
            return null;
        }

        // Retorna a URL pública
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(LOGO_PATH);
        return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
    } catch (error) {
        console.error('Erro ao fazer upload do logo:', error);
        return null;
    }
};

/**
 * Cria o bucket app-assets se não existir (deve ser chamado uma vez pelo admin)
 */
export const ensureBucketExists = async (): Promise<boolean> => {
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

        if (!bucketExists) {
            const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
            });

            if (error) {
                console.error('Erro ao criar bucket:', error);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Erro ao verificar bucket:', error);
        return false;
    }
};
