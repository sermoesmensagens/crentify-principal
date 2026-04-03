
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://dhadesogklhggtixlcsk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const results = {};

  try {
    // 1. List Schema Tables
    const { data: tables, error: tableError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    results.tables = tables;

    // 2. Check Triggers on auth.users
    // We can't query auth schema directly easily without RPC, but we can check for common profile-creation functions in public schema
    const { data: functions, error: funcError } = await supabase
      .rpc('get_functions_schema'); // This might not exist
    
    // 3. Check for 'profiles' table columns
    const { data: profileCols, error: pColError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);
    
    if (pColError) {
        results.profilesError = pColError.message;
    } else {
        // We can't get columns easily this way, but we can try to insert a dummy record and see the error? No.
        results.profilesAccessible = true;
    }

    // 4. Try to find the trigger function in public schema
    // List all functions in public schema
    const { data: pgProcs, error: procError } = await supabase
        .rpc('execute_sql', { sql_query: "SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';" });
    results.functions = pgProcs;

  } catch (err) {
    results.error = err.message;
  }

  fs.writeFileSync('debug_results_v2.json', JSON.stringify(results, null, 2));
}

run();
