import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const envLines = envText.split('\n');
const envConfig = {};
for (const line of envLines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        envConfig[key] = value;
    }
}

const url = envConfig.VITE_SUPABASE_URL;
const key = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testRpc() {
    console.log("Logging in as admin...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: "admin@seuclube.com",
        password: "SenhaAdmin123!"
    });
    
    if (authError) {
        console.error("Login failed:", authError.message);
        return;
    }
    
    console.log("Logged in successfully! Token:", authData.session.access_token.slice(0, 20) + "...");
    
    const sql = `SELECT 1 as test;`;
    
    console.log("Testing execute_sql_query RPC...");
    const { data: r1, error: e1 } = await supabase.rpc('execute_sql_query', { sql_query: sql });
    if (e1) {
        console.log("execute_sql_query failed:", e1.message);
    } else {
        console.log("execute_sql_query succeeded:", r1);
    }
    
    console.log("Testing exec_sql RPC...");
    const { data: r2, error: e2 } = await supabase.rpc('exec_sql', { query: sql });
    if (e2) {
        console.log("exec_sql failed:", e2.message);
    } else {
        console.log("exec_sql succeeded:", r2);
    }

    console.log("Testing execute_sql RPC...");
    const { data: r3, error: e3 } = await supabase.rpc('execute_sql', { query: sql });
    if (e3) {
        console.log("execute_sql failed:", e3.message);
    } else {
        console.log("execute_sql succeeded:", r3);
    }
}

testRpc();
