
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile() {
    const { data: profiles, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false }).limit(5);
    console.log('Recent profiles:', JSON.stringify(profiles, null, 2));
}

checkProfile();
