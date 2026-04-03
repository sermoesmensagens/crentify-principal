
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectProfiles() {
    console.log('--- Inspecting profiles table structure ---');
    // We can't get schema directly, but we can try to select one row and see all keys
    const { data: profiles, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error('Error selecting from profiles:', error);
    } else if (profiles && profiles.length > 0) {
        console.log('Columns found:', Object.keys(profiles[0]).join(', '));
        console.log('Sample record:', JSON.stringify(profiles[0], null, 2));
    } else {
        console.log('Profiles table is empty. Trying to insert a test record to identify missing columns...');
        const { error: insertError } = await supabase.from('profiles').insert({ email: 'test_meta@example.com' });
        if (insertError) {
            console.log('Insert error hint:', insertError.message);
        }
    }
}

inspectProfiles();
