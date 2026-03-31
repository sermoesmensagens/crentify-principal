import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('\n--- Checking ALL Shared Keys in user_data (Bypassing profiles) ---');
    const sharedKeys = [
        'crentify_bible_data', 
        'crentify_bible_progress', 
        'crentify_academy_content', 
        'crentify_academy_categories', 
        'crentify_academy_courses',
        'crentify_academy_weeks',
        'crentify_academy_days'
    ];

    const { data: allData, error: dataError } = await supabase
        .from('user_data')
        .select('key, user_id, updated_at')
        .in('key', sharedKeys);
        
    if (dataError) {
        console.error('Error fetching user_data:', dataError);
    } else {
        console.log(`Found ${allData?.length || 0} shared data rows.`);
        allData?.forEach(d => console.log(`- Key: ${d.key} | UserID: ${d.user_id} | Updated: ${d.updated_at}`));
    }

    console.log('\n--- Checking for OTHER users data ---');
    const { data: samples, error: sampleError } = await supabase
        .from('user_data')
        .select('user_id')
        .limit(5);
    
    if (sampleError) {
        console.error('Error fetching user_id samples:', sampleError);
    } else {
        console.log('Sample User IDs in the table:');
        samples?.forEach(s => console.log(`- ${s.user_id}`));
    }
}

checkData();
