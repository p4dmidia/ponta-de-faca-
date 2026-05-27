-- ============================================================================
-- CRIAR PERFIL DE ADMINISTRADOR (admin@pontadefaca.com.br)
-- Execute este script no SQL Editor do painel da Supabase
-- ============================================================================

-- 1. Inserir perfil na tabela user_profiles
INSERT INTO public.user_profiles (
    id,
    email,
    role,
    full_name,
    login,
    organization_id,
    status,
    is_active,
    created_at,
    updated_at
) VALUES (
    'ee77ea54-52c2-4b9b-b420-eeaa3a26fcbe'::uuid,
    'admin@pontadefaca.com.br',
    'admin_master',
    'Administrador Mestre',
    'admin',
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    'active',
    true,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET 
    role = 'admin_master',
    status = 'active',
    is_active = true,
    updated_at = now();

-- 2. Inserir configurações do usuário na tabela user_settings
INSERT INTO public.user_settings (
    user_id,
    organization_id,
    total_earnings,
    available_balance,
    frozen_balance,
    is_active_this_month,
    created_at,
    updated_at
) VALUES (
    'ee77ea54-52c2-4b9b-b420-eeaa3a26fcbe'::uuid,
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    0,
    0,
    0,
    true,
    now(),
    now()
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Inserir na tabela de afiliados
INSERT INTO public.affiliates (
    user_id,
    email,
    full_name,
    referral_code,
    organization_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    'ee77ea54-52c2-4b9b-b420-eeaa3a26fcbe'::uuid,
    'admin@pontadefaca.com.br',
    'Administrador Mestre',
    'admin',
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    true,
    now(),
    now()
) ON CONFLICT (user_id) DO UPDATE SET 
    is_active = true,
    updated_at = now();
