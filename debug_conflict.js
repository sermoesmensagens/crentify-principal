
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findConflict() {
    console.log('--- Searching for ANY record related to robson28.carvalho ---');
    
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', '%robson28.carvalho%');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profiles found:', JSON.stringify(profiles, null, 2));
    }

    const { data: userData, error: userDataError } = await supabase
        .from('user_data')
        .select('user_id, key')
        .limit(10);
    
    console.log('Sample user_data to see what user IDs look like:', JSON.stringify(userData, null, 2));
}

findConflict();
