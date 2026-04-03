
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    const sql = fs.readFileSync('supabase/migrations/20260403_fix_auth_trigger.sql', 'utf8');
    
    console.log('--- Attempting to apply migration via RPC execute_sql ---');
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
        console.error('RPC execute_sql failed:', error.message);
        console.log('Trying alternative: split SQL and execute parts? (Probably won\'t work if RPC is missing)');
        
        // Final fallback: ask user
        console.log('\n--- MANUAL ACTION REQUIRED ---');
        console.log('The migration could not be applied automatically. Please copy the SQL from:');
        console.log('supabase/migrations/20260403_fix_auth_trigger.sql');
        console.log('And paste it into the SQL Editor in your Supabase Dashboard: https://supabase.com/dashboard/project/dhadesogklhggtixlcsk/sql/new');
    } else {
        console.log('Migration applied successfully via RPC!');
    }
}

applyMigration();
