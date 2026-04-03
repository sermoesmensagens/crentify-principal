
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://dhadesogklhggtixlcsk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const results = {};

  try {
    // 1. List Users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    results.authUsersCount = authUsers?.users?.length || 0;
    results.targetUser = authUsers?.users?.find(u => u.email === 'robson28.carvalho@gmail.com');

    // 2. Look for triggers/functions that might be failing
    // We can query pg_trigger and pg_proc via the service role key if we use a dynamic SQL approach
    // or just check the public schema for tables that might be related (profiles, etc.)
    const { data: tables, error: tableError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    results.publicTables = tables;

    // 3. Specifically check if there's a profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    results.profilesExist = !profilesError;

    // 4. Try to find the error by looking at the logs if possible? No direct logs via SDK.
    
    // 5. Check user_data for the target user ID if found
    if (results.targetUser) {
        const { data: userData } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', results.targetUser.id);
        results.targetUserData = userData;
    }

  } catch (err) {
    results.error = err.message;
  }

  fs.writeFileSync('debug_results.json', JSON.stringify(results, null, 2));
}

run();
