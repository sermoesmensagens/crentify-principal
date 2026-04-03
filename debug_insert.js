
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
    console.log('--- Testing insert into public.profiles ---');
    const testId = '00000000-0000-0000-0000-000000000000';
    const testEmail = 'test@example.com';
    
    const { error } = await supabase
        .from('profiles')
        .insert({ id: testId, email: testEmail });
    
    if (error) {
        console.error('Insert failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert successful! Deleting test record...');
        await supabase.from('profiles').delete().eq('id', testId);
    }
}

testInsert();
