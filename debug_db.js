import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL'; // Found in .env.local

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('--- Checking Profiles ---');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
    
    if (profileError) {
        console.error('Error fetching profiles:', profileError);
    } else {
        console.log('Profiles found:', profiles.length);
        profiles.forEach(p => console.log(`- ${p.email} (ID: ${p.id}, Role: ${p.role || 'N/A'})`));
    }

    console.log('\n--- Checking Admin User Data (sermoes.mensagens@gmail.com) ---');
    // Find the ID for sermoes.mensagens@gmail.com
    const admin = profiles?.find(p => p.email === 'sermoes.mensagens@gmail.com');
    if (admin) {
        const { data: userData, error: dataError } = await supabase
            .from('user_data')
            .select('key, updated_at')
            .eq('user_id', admin.id);
        
        if (dataError) {
            console.error('Error fetching user_data:', dataError);
        } else {
            console.log(`Data rows for admin ${admin.email}:`, userData.length);
            userData.forEach(d => console.log(`- Key: ${d.key} (Updated: ${d.updated_at})`));
        }
    } else {
        console.log('Admin sermoes.mensagens@gmail.com not found in profiles.');
    }

    console.log('\n--- Checking Shared Keys in user_data (Any user) ---');
    const { data: sharedKeys, error: keysError } = await supabase
        .from('user_data')
        .select('key, user_id, updated_at')
        .in('key', [
            'crentify_bible_data', 
            'crentify_academy_content', 
            'crentify_academy_courses'
        ]);
    
    if (keysError) {
        console.error('Error fetching shared keys:', keysError);
    } else {
        console.log('Number of shared data rows found:', sharedKeys.length);
        sharedKeys.forEach(k => console.log(`- Key: ${k.key} | UserID: ${k.user_id} | Updated: ${k.updated_at}`));
    }
}

checkData();
