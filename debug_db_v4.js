
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findFunction() {
    console.log('--- Searching for functions in public schema ---');
    // Using a trick: try to find functions mentioned in other ways
    const { data: results, error } = await supabase.from('profiles').select('*').limit(0);
    // If profiles exist, what columns does it have?
    console.log('Profiles table exists.');

    // Try a simple RPC call to see if it even connects
    const { data, error: rpcError } = await supabase.rpc('hello_world'); // To test if RPC works
    console.log('RPC check:', rpcError?.message === 'function public.hello_world() does not exist' ? 'RPC works (func not found)' : rpcError?.message);

    // List any table that might be a trigger target
    const { data: tables, error: tableError } = await supabase
        .from('_prisma_migrations') // Prisma?
        .select('*')
        .limit(1);
    console.log('Prisma migrations:', tableError ? 'No Prisma' : 'Prisma found');
}

findFunction();
