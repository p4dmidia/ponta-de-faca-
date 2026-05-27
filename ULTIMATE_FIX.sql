-- ============================================================================
-- SCRIPT DE CORREÇÃO DEFINITIVA (REGISTRO, ADMIN E PERFIS EM ATRASO)
-- Execute este script no SQL Editor do painel da Supabase
-- ============================================================================

-- 1. CORRIGIR A FUNÇÃO DE PERMISSÃO DE ADMIN (Suporte a admin_master e admin_op)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'admin_master', 'admin_op')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATUALIZAR GATILHO DE CRIAÇÃO DE USUÁRIOS (handle_new_affiliate_user)
-- Nota: Removemos os blocos EXCEPTION WHEN OTHERS THEN NULL para que erros reais 
-- de validação (como CPF duplicado) sejam exibidos no cadastro e revertam a transação.
-- Também não há sponsor fallback automático (deixa NULL se não inserido).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 AS $function$
 DECLARE
   v_full_name text;
   v_sponsor_affiliate_id uuid;
   v_sponsor_user_id uuid;
   v_org_id uuid;
   v_sponsor_code text;
   v_login text;
 BEGIN
   -- Determinar login e nome
   v_login := COALESCE(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1));
   v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
   IF v_full_name = '' THEN v_full_name := v_login; END IF;

   -- Determinar Organização
   BEGIN
     v_org_id := NULLIF(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
   EXCEPTION WHEN OTHERS THEN
     v_org_id := NULL;
   END;

   IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
   END IF;
   IF v_org_id IS NULL THEN
      v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;
   END IF;

   -- Resolver Padrinho (Sponsor)
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Criar Perfil do Usuário
   INSERT INTO public.user_profiles (
     id, email, role, full_name, login, 
     whatsapp, cpf, cnpj, registration_type, 
     organization_id, sponsor_id, referrer_id,
     status, rank, created_at, updated_at
   ) VALUES (
     new.id, new.email, 
     COALESCE(new.raw_user_meta_data ->> 'role', 'affiliate'),
     v_full_name, v_login,
     new.raw_user_meta_data ->> 'whatsapp',
     new.raw_user_meta_data ->> 'cpf',
     new.raw_user_meta_data ->> 'cnpj',
     new.raw_user_meta_data ->> 'registration_type',
     v_org_id, v_sponsor_user_id, v_sponsor_user_id, 
     'active', 'Consultor', new.created_at, new.created_at
   );

   -- Criar Registro na tabela Affiliates
   INSERT INTO public.affiliates (
     user_id, email, full_name, referral_code, 
     whatsapp, cpf, cnpj, organization_id, sponsor_id, 
     is_active, created_at, updated_at
   ) VALUES (
     new.id, new.email, v_full_name, v_login,
     new.raw_user_meta_data ->> 'whatsapp',
     new.raw_user_meta_data ->> 'cpf',
     new.raw_user_meta_data ->> 'cnpj',
     v_org_id, v_sponsor_affiliate_id, 
     true, new.created_at, new.created_at
   );

   -- Criar Configurações Iniciais de Saldo
   INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
   VALUES (new.id, v_org_id, new.created_at, new.created_at);
   
   RETURN new;
 END;
 $function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate_user();


-- 3. CRIAR MANUALMENTE OS PERFIS DOS USUÁRIOS QUE CADASTRAM ANTERIORMENTE E FALHARAM
-- (Usuários que ficaram na tabela auth.users e affiliates mas sem user_profiles / user_settings)

-- Corrigir perfil de pig@gmail.com (id: bfb73aab-5d63-4845-ac00-2d7af4f49b1f)
INSERT INTO public.user_profiles (
    id, email, role, full_name, login, whatsapp, organization_id, status, rank, created_at, updated_at
) VALUES (
    'bfb73aab-5d63-4845-ac00-2d7af4f49b1f'::uuid,
    'pig@gmail.com',
    'affiliate',
    'pepa',
    'pig',
    '(31) 95544-7788',
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    'active',
    'Consultor',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (
    user_id, organization_id, created_at, updated_at
) VALUES (
    'bfb73aab-5d63-4845-ac00-2d7af4f49b1f'::uuid,
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Corrigir perfil de hexa@gmail.com (id: da1ec399-d465-44d1-9bdf-b2e8d54efa18)
INSERT INTO public.user_profiles (
    id, email, role, full_name, login, whatsapp, organization_id, status, rank, created_at, updated_at
) VALUES (
    'da1ec399-d465-44d1-9bdf-b2e8d54efa18'::uuid,
    'hexa@gmail.com',
    'affiliate',
    'paqueta',
    'hexa',
    '(31) 99800-0000',
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    'active',
    'Consultor',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (
    user_id, organization_id, created_at, updated_at
) VALUES (
    'da1ec399-d465-44d1-9bdf-b2e8d54efa18'::uuid,
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;
