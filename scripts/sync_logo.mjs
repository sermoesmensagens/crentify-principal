import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual ENV parser since dotenv might not be available
function parseEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            config[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
        }
    });
    return config;
}

const envPath = 'f:/TRABALHO/MICROSAAS/CRENTIFY/atualizações/crentify-2026/.env.local';
const envConfig = parseEnv(envPath);

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_KEY = envConfig.SUPABASE_SECRET_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase URL or Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'app-assets';
const LOGO_PATH = 'logo/main-logo.png';
const LOCAL_LOGO_PATH = 'f:/TRABALHO/MICROSAAS/CRENTIFY/atualizações/crentify-2026/public/logo-v2.png';

async function syncLogo() {
    console.log('🚀 Iniciando sincronização do logo com Supabase Storage...');

    try {
        const fileBuffer = fs.readFileSync(LOCAL_LOGO_PATH);

        // Use UPSERT to replace existing file
        console.log('📤 Fazendo upload do novo logo (upsert)...');
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(LOGO_PATH, fileBuffer, {
                contentType: 'image/png',
                upsert: true,
                cacheControl: '0'
            });

        if (error) {
            console.error('❌ Erro no upload:', error.message);
            // If it fails with "already exists", try removing first
            if (error.message.includes('already exists')) {
                console.log('🔄 Tentando remover e re-enviar...');
                await supabase.storage.from(BUCKET_NAME).remove([LOGO_PATH]);
                const { error: retryError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(LOGO_PATH, fileBuffer, {
                        contentType: 'image/png',
                        upsert: true,
                        cacheControl: '0'
                    });
                if (retryError) throw retryError;
            } else {
                process.exit(1);
            }
        }

        console.log('✅ Logo sincronizado com sucesso!');
    } catch (err) {
        console.error('❌ Erro fatal:', err);
        process.exit(1);
    }
}

syncLogo();
