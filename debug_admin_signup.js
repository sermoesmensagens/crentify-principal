
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhadesogklhggtixlcsk.supabase.co';
const supabaseServiceKey = 'sb_secret_Xb1j9SsoByNilTqRGwPFfg_sR9lTewL';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminSignup() {
    console.log('--- Attempting to create a user via Admin API to see the error ---');
    const testEmail = `debug_admin_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
    });

    if (error) {
        console.error('Admin Signup failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Admin Signup successful! User ID:', data.user.id);
        // If it worked via admin, then the trigger is working fine? 
        // Wait, admin.createUser might still fire the trigger.
    }
}

testAdminSignup();
