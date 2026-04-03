
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTriggers() {
    console.log('--- Finding Triggers on auth.users ---');
    // Using a more standard SQL to find triggers if possible
    const { data: results, error } = await supabase.rpc('execute_sql', {
        sql_query: `
            SELECT 
                tgname AS trigger_name,
                proname AS function_name,
                prosrc AS function_definition
            FROM pg_trigger
            JOIN pg_proc ON tgfoid = pg_proc.oid
            WHERE tgrelid = 'auth.users'::regclass;
        `
    });

    if (error) {
        console.error('Cannot query triggers directly via execute_sql:', error.message);
        // Let's try to query public functions instead
        const { data: funcs, error: funcError } = await supabase.rpc('execute_sql', {
            sql_query: "SELECT proname, prosrc FROM pg_proc WHERE pronamespace = 'public'::regnamespace;"
        });
        if (funcs) console.log('Public functions:', JSON.stringify(funcs, null, 2));
    } else {
        console.log('Trigger info:', JSON.stringify(results, null, 2));
    }
}

findTriggers();
