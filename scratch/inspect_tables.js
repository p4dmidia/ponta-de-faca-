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

async function checkProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');
        if (error) {
            console.error("Error fetching products:", error.message);
        } else {
            console.log("Products in database:", data);
        }
    } catch (e) {
        console.error(e);
    }
}

checkProducts();
