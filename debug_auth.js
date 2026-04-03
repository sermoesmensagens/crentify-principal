
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dhadesogklhggtixlcsk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugSignup() {
  console.log('Checking triggers on auth.users...');
  const { data: triggers, error: triggerError } = await supabase.rpc('execute_sql', {
    sql_query: `
      SELECT 
        trig.tgname AS trigger_name,
        proc.proname AS function_name,
        rel.relname AS table_name
      FROM pg_trigger trig
      JOIN pg_class rel ON trig.tgrelid = rel.oid
      JOIN pg_proc proc ON trig.tgfoid = proc.oid
      JOIN pg_namespace ns ON rel.relnamespace = ns.oid
      WHERE rel.relname = 'users' AND ns.nspname = 'auth';
    `
  });

  if (triggerError) {
    console.error('Error fetching triggers:', triggerError);
    // Try a different way if RPC is not available
    console.log('Trying direct query for users in public schema...');
  } else {
    console.log('Triggers:', triggers);
  }

  // Check if the user exists in auth.users (requires service role)
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError);
  } else {
    const user = authUsers.users.find(u => u.email === 'robson28.carvalho@gmail.com');
    console.log('User in auth.users:', user ? 'Found' : 'Not found');
    if (user) console.log('User details:', JSON.stringify(user, null, 2));
  }

  // Check public.user_data or other tables
  const { data: userData, error: userDataError } = await supabase
    .from('user_data')
    .select('*')
    .limit(5);
  
  if (userDataError) {
    console.error('Error fetching user_data:', userDataError);
  } else {
    console.log('Sample user_data:', userData);
  }
}

debugSignup();
