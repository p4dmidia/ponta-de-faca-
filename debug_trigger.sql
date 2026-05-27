-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO: DIAGNOSTICAR ERRO NO GATILHO DE CADASTRO
-- Execute este script no SQL Editor do painel da Supabase
-- ============================================================================

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
   v_err_msg text;
   v_err_detail text;
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
   BEGIN
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
   EXCEPTION WHEN OTHERS THEN 
     GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT, v_err_detail = PG_EXCEPTION_DETAIL;
     INSERT INTO public.debug_logs (operation, message, metadata)
     VALUES ('handle_new_affiliate_user:user_profiles', v_err_msg, jsonb_build_object('detail', v_err_detail, 'user_id', new.id));
   END;

   -- Criar Registro na tabela Affiliates
   BEGIN
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
   EXCEPTION WHEN OTHERS THEN 
     GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT, v_err_detail = PG_EXCEPTION_DETAIL;
     INSERT INTO public.debug_logs (operation, message, metadata)
     VALUES ('handle_new_affiliate_user:affiliates', v_err_msg, jsonb_build_object('detail', v_err_detail, 'user_id', new.id));
   END;

   -- Criar Configurações Iniciais de Saldo
   BEGIN
     INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
     VALUES (new.id, v_org_id, new.created_at, new.created_at);
   EXCEPTION WHEN OTHERS THEN 
     GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT, v_err_detail = PG_EXCEPTION_DETAIL;
     INSERT INTO public.debug_logs (operation, message, metadata)
     VALUES ('handle_new_affiliate_user:user_settings', v_err_msg, jsonb_build_object('detail', v_err_detail, 'user_id', new.id));
   END;
   
   RETURN new;
 END;
 $function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate_user();
