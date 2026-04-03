
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    const emails = ['andrea.marcelamkt@gmail.com', 'sermoes.mensagens@gmail.com'];
    
    for (const email of emails) {
        console.log(`\n=== Checking data for: ${email} ===`);
        
        // Find user ID from profiles
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
        
        if (pError || !profile) {
            console.error(`Profile Not Found for ${email}:`, pError?.message || 'No profile');
            continue;
        }
        
        const userId = profile.id;
        console.log(`User ID: ${userId}`);
        
        // Check user_data (Bible reading, etc.)
        const { data: userData, error: udError } = await supabase
            .from('user_data')
            .select('key, updated_at')
            .eq('user_id', userId);
        
        console.log(`user_data count: ${userData?.length || 0}`);
        if (userData?.length > 0) {
            userData.forEach(d => console.log(`- Key: ${d.key} (${d.updated_at})`));
        }

        // Check Cultos (service_events/details)
        const { data: events, error: eError } = await supabase
            .from('service_events')
            .select('id, title')
            .eq('user_id', userId);
        
        console.log(`service_events count: ${events?.length || 0}`);
        if (events?.length > 0) {
            events.forEach(e => console.log(`- Event: ${e.title}`));
        }
    }
}

checkData();
