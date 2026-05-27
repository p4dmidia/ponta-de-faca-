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

const sql = `
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 15 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS min_stock_limit integer DEFAULT 5 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reorder_status text DEFAULT 'none' NOT NULL 
    CONSTRAINT check_reorder_status CHECK (reorder_status IN ('none', 'pending', 'completed'));
`;

async function executeSql() {
    console.log("Executing SQL migration...");
    try {
        // Try execute_sql_query
        const { data: data1, error: error1 } = await supabase
            .rpc('execute_sql_query', { sql_query: sql });
        
        if (error1) {
            console.log("execute_sql_query failed, trying exec_sql...");
            const { data: data2, error: error2 } = await supabase
                .rpc('exec_sql', { query: sql });
            
            if (error2) {
                console.error("exec_sql also failed:", error2.message);
            } else {
                console.log("exec_sql succeeded:", data2);
            }
        } else {
            console.log("execute_sql_query succeeded:", data1);
        }
    } catch (e) {
        console.error("Catch error:", e);
    }
}

executeSql();
