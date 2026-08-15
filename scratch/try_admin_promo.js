const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eqlqxitphaqvviazkrvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const email = `test.admin.${Math.floor(Math.random() * 100000)}@pontadefaca.com.br`;
    const password = 'AdminPassword123!';
    const organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
    
    console.log('--- Step 1: Signing up new user:', email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nome: 'Admin',
                sobrenome: 'Test',
                login: `admtest${Math.floor(Math.random() * 100000)}`,
                registration_type: 'individual',
                role: 'client',
                organization_id
            }
        }
    });

    if (signUpError) {
        console.error('Sign up error:', signUpError.message);
        return;
    }
    const userId = signUpData.user.id;
    console.log('Sign up success. User ID:', userId);

    console.log('\n--- Step 2: Waiting for trigger to create user_profile ---');
    await new Promise(r => setTimeout(r, 3000));

    console.log('\n--- Step 3: Logging in to get authenticated session ---');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login error:', loginError.message);
        return;
    }
    console.log('Login success.');

    // Now try to update own profile role
    console.log('\n--- Step 4: Trying to update role to admin_master ---');
    const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin_master' })
        .eq('id', userId)
        .select();

    if (updateError) {
        console.error('Update error:', updateError.message);
    } else {
        console.log('Update success! Response:', updateData);
    }

    // Verify current profile in DB
    console.log('\n--- Step 5: Checking final profile role in database ---');
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Profile query error:', profileError.message);
    } else {
        console.log('Final Profile Role:', profile.role);
        console.log('Email:', email);
        console.log('Password:', password);
    }
}

run().catch(console.error);
