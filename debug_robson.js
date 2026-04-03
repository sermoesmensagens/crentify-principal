
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificUser() {
    console.log('--- Checking for robson28.carvalho@gmail.com ---');
    
    // Check in auth.users (requires service role / admin)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === 'robson28.carvalho@gmail.com');
    console.log('In auth.users:', authUser ? `YES (ID: ${authUser.id})` : 'NO');

    // Check in public.profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'robson28.carvalho@gmail.com');
    
    if (profileError) {
        console.error('Error fetching profiles:', profileError);
    } else {
        console.log('In public.profiles:', profiles.length > 0 ? `YES (Count: ${profiles.length}, First ID: ${profiles[0].id})` : 'NO');
        if (profiles.length > 0) {
            console.log('Profile details:', JSON.stringify(profiles[0], null, 2));
        }
    }
}

checkSpecificUser();
