
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTriggers() {
    const results = {};
    try {
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
        results.profiles = profiles;
        
        // Also check if there's any user in user_data
        const { data: userData, error: userDataError } = await supabase.from('user_data').select('*').limit(5);
        results.userData = userData;

    } catch (error) {
        results.error = error.message;
    }
    fs.writeFileSync('debug_db_data.json', JSON.stringify(results, null, 2));
}

findTriggers();
