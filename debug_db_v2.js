import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('\n--- Checking ALL Shared Keys in user_data ---');
    const { data: allData, error: dataError } = await supabase
        .from('user_data')
        .select('key, user_id, updated_at')
        .in('key', [
            'crentify_bible_data', 
            'crentify_bible_progress', 
            'crentify_academy_content', 
            'crentify_academy_categories', 
            'crentify_academy_courses',
            'crentify_academy_weeks',
            'crentify_academy_days'
        ]);
        
    if (dataError) {
        console.error('Error fetching user_data:', dataError);
    } else if (allData) {
        console.log(`Found ${allData.length} shared data rows.`);
        allData.forEach(d => console.log(`- Key: ${d.key} | UserID: ${d.user_id} | Updated: ${d.updated_at}`));
    }

    console.log('\n--- Checking if profiles table exists ---');
    const { error: profileCheckError } = await supabase.from('profiles').select('id').limit(1);
    if (profileCheckError) {
        console.log('Profiles table check FAILED:', profileCheckError.message);
    } else {
        console.log('Profiles table EXISTS.');
    }
}

checkData();
