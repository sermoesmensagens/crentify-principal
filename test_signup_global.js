
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseAnonKey = 'sb_publishable_duQoQgE2gZ9NxkoIjOn3_w_CR1MgHeJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
    const testEmail = `debug_test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log(`Testing signup with: ${testEmail}`);
    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
    });

    if (error) {
        console.error('Signup failed for test account:', error.message);
    } else {
        console.log('Signup successful for test account! (User ID:', data.user?.id, ')');
        // No need to delete, it's a test auth user - I don't have admin access here easy but I can use service role later to clean up
    }
}

testSignup();
