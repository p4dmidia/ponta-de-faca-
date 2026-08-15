const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eqlqxitphaqvviazkrvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'test.admin.56696@pontadefaca.com.br';
const password = 'AdminPassword123!';
const organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';

async function run() {
    console.log('--- Step 1: Logging in as Admin ---');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (authError) {
        console.error('Login failed:', authError.message);
        return;
    }
    console.log('Login successful! Authenticated User:', authData.user.email);

    // Ensure we are using the authenticated client
    const client = supabase;

    // Helper slugify function
    const slugify = (text) => {
        return text.toString().toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    };

    console.log('\n--- Step 2: Testing Physical Product Insertion ---');
    const productData = {
        name: 'Copa Defumada Artesanal Teste',
        category_id: 14, // Defumados
        price: 65.50,
        stock_quantity: 45,
        description: 'Copa defumada artesanalmente para testes automatizados.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        is_active: true,
        weight: 0.5,
        length: 22,
        width: 12,
        height: 8,
        origin_zip: '30130-100',
        organization_id: organization_id,
        variations: null
    };

    const { data: insertedProduct, error: productError } = await client
        .from('products')
        .insert([productData])
        .select();

    if (productError) {
        console.error('Failed to insert physical product:', productError.message);
    } else {
        console.log('Physical product inserted successfully!', insertedProduct[0].name, 'ID:', insertedProduct[0].id);
    }

    console.log('\n--- Step 3: Finding or Creating "Planos" Category ---');
    let planosCategoryId = null;
    const { data: catData, error: catError } = await client
        .from('product_categories')
        .select('id')
        .eq('name', 'Planos')
        .eq('organization_id', organization_id)
        .maybeSingle();

    if (catData) {
        planosCategoryId = catData.id;
        console.log('Category "Planos" found with ID:', planosCategoryId);
    } else {
        console.log('Category "Planos" not found. Creating it...');
        const { data: newCat, error: createCatError } = await client
            .from('product_categories')
            .insert([{ name: 'Planos', organization_id: organization_id }])
            .select('id')
            .single();
        if (createCatError) {
            console.error('Failed to create "Planos" category:', createCatError.message);
        } else {
            planosCategoryId = newCat.id;
            console.log('Category "Planos" created with ID:', planosCategoryId);
        }
    }

    console.log('\n--- Step 4: Testing Subscription Plan Insertion ---');
    const planData = {
        name: 'Clube Ponta D\'Faca - Teste Mensal Flex',
        category_id: planosCategoryId,
        price: 130.00,
        stock_quantity: 999,
        description: 'Assinatura teste de clube de charcutaria.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        is_active: true,
        weight: 1.0,
        length: 20,
        width: 15,
        height: 10,
        origin_zip: '30130-100',
        organization_id: organization_id,
        variations: {
            plan_type: 'Individual',
            adesao: 130.00,
            mensalidade: 130.00,
            custo_plataforma: 13.00,
            comissao_adesao: 13.00,
            comissao_mensal: 6.50,
            slug: slugify('Clube Ponta D\'Faca - Teste Mensal Flex')
        }
    };

    const { data: insertedPlan, error: planError } = await client
        .from('products')
        .insert([planData])
        .select();

    if (planError) {
        console.error('Failed to insert subscription plan:', planError.message);
    } else {
        console.log('Subscription plan inserted successfully!', insertedPlan[0].name, 'ID:', insertedPlan[0].id);
    }

    console.log('\n--- Step 5: Clean Up (Deleting Test Records) ---');
    if (insertedProduct && insertedProduct[0]) {
        const { error: delProdError } = await client
            .from('products')
            .delete()
            .eq('id', insertedProduct[0].id);
        if (delProdError) console.error('Failed to delete test product:', delProdError.message);
        else console.log('Deleted test physical product.');
    }
    if (insertedPlan && insertedPlan[0]) {
        const { error: delPlanError } = await client
            .from('products')
            .delete()
            .eq('id', insertedPlan[0].id);
        if (delPlanError) console.error('Failed to delete test subscription plan:', delPlanError.message);
        else console.log('Deleted test subscription plan.');
    }
}

run().catch(console.error);
