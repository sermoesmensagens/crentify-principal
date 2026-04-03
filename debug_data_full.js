
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    const emails = ['andrea.marcelamkt@gmail.com', 'sermoes.mensagens@gmail.com'];
    
    for (const email of emails) {
        console.log(`\n=== Checking data for: ${email} ===`);
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (!profile) { console.log('No profile'); continue; }
        
        const { data: userData } = await supabase.from('user_data').select('*').eq('user_id', profile.id);
        console.log('User ID:', profile.id);
        console.log('Total user_data rows:', userData?.length || 0);
        
        if (userData) {
            userData.forEach(d => {
                const size = JSON.stringify(d.value).length;
                console.log(`Key: ${d.key} | Updated: ${d.updated_at} | Size: ${size} bytes`);
                // If it's a list, check if it's empty
                if (Array.isArray(d.value)) {
                    console.log(`  -> Array length: ${d.value.length}`);
                }
            });
        }
    }
}

checkData();
