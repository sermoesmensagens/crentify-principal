
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTriggers() {
    console.log('--- Finding Triggers on auth.users ---');
    // Using RPC to execute SQL since we can't query pg_catalog via PostgREST
    // We hope 'execute_sql' exists (common in Supabase debug tools)
    const { data: results, error } = await supabase.rpc('execute_sql', {
        sql_query: `
            SELECT 
                tgname AS trigger_name,
                proname AS function_name,
                adsrc AS function_definition
            FROM pg_trigger
            JOIN pg_proc ON tgfoid = pg_proc.oid
            JOIN pg_attrdef ON adrelid = tgrelid
            WHERE tgrelid = 'auth.users'::regclass;
        `
    });

    if (error) {
        console.log('Standard execute_sql RPC failed, trying to find profile functions in public schema instead...');
        const { data: funcs, error: funcError } = await supabase
            .from('pg_catalog.pg_proc') // This might still fail
            .select('*')
            .limit(0);
        
        console.log('Checking for common profile tables...');
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').limit(5);
        if (profiles) console.log('Profiles table exists, first 5:', JSON.stringify(profiles, null, 2));
    } else {
        console.log('Trigger info:', JSON.stringify(results, null, 2));
    }
}

findTriggers();
