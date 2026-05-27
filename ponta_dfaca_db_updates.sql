-- ============================================================================
-- SCRIPT CONSOLIDADO DE ATUALIZAÇÕES: PONTA D'FACA CHARCUTARIA
-- ============================================================================
-- Instruções: Após executar o script 'supabase_complete_schema.sql' no Editor SQL,
-- execute este script para aplicar todas as customizações da Ponta D'Faca.

-- 1. ADICIONAR COLUNAS DE CONTROLE NO PERFIL E AFILIADOS
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS maintenance_expires_at timestamp with time zone;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_delinquent boolean DEFAULT false;

ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS maintenance_expires_at timestamp with time zone;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS is_delinquent boolean DEFAULT false;


-- 2. CRIAÇÃO DA TABELA DE FILA DE ESPERA (WAITING_LIST)
CREATE TABLE IF NOT EXISTS public.waiting_list (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    whatsapp text NOT NULL,
    email text NOT NULL,
    city text,
    notified boolean DEFAULT false,
    notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na fila de espera
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para fila de espera
DROP POLICY IF EXISTS "Permitir inserção pública na lista de espera" ON public.waiting_list;
CREATE POLICY "Permitir inserção pública na lista de espera" 
    ON public.waiting_list FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura para admins" ON public.waiting_list;
CREATE POLICY "Permitir leitura para admins" 
    ON public.waiting_list FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid() 
              AND user_profiles.role IN ('admin_master', 'admin_op')
        )
    );

DROP POLICY IF EXISTS "Permitir atualização para admins" ON public.waiting_list;
CREATE POLICY "Permitir atualização para admins" 
    ON public.waiting_list FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid() 
              AND user_profiles.role IN ('admin_master', 'admin_op')
        )
    );


-- 3. ADICIONAR COLUNAS DE CONTROLE E ESTOQUE NA TABELA DE EMPRESAS (PDVs)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_model text DEFAULT 'centralized' 
    CONSTRAINT check_billing_model CHECK (billing_model IN ('centralized', 'consigned'));

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 15 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS min_stock_limit integer DEFAULT 5 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reorder_status text DEFAULT 'none' NOT NULL 
    CONSTRAINT check_reorder_status CHECK (reorder_status IN ('none', 'pending', 'completed'));

COMMENT ON COLUMN public.companies.billing_model IS 'Modelo de faturamento: centralized ou consigned';
COMMENT ON COLUMN public.companies.stock_quantity IS 'Quantidade atual de combos de carne defumada em estoque no PDV';
COMMENT ON COLUMN public.companies.min_stock_limit IS 'Limite mínimo de estoque para disparar alertas de reposição';
COMMENT ON COLUMN public.companies.reorder_status IS 'Status da solicitação de reposição';


-- 4. CADASTRO DE CATEGORIAS E CONFIGURAÇÃO MMN (3 NÍVEIS)
-- Limpar e recriar as configurações de comissões para a organização (3 níveis: N1=10%, N2=3%, N3=2%)
DELETE FROM public.commission_configs WHERE organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;

INSERT INTO public.commission_configs (key, type, active_generations, levels, organization_id)
VALUES 
(
    'plan_adesao', 
    'percent', 
    3, 
    '[
        {"level": 1, "value": 10}, 
        {"level": 2, "value": 3}, 
        {"level": 3, "value": 2}
    ]'::jsonb, 
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid
),
(
    'plan_mensal', 
    'percent', 
    3, 
    '[
        {"level": 1, "value": 10}, 
        {"level": 2, "value": 3}, 
        {"level": 3, "value": 2}
    ]'::jsonb, 
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid
),
(
    'geral', 
    'percent', 
    3, 
    '[
        {"level": 1, "value": 10}, 
        {"level": 2, "value": 3}, 
        {"level": 3, "value": 2}
    ]'::jsonb, 
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid
);


-- 5. REDEFINIR FUNÇÃO DE DISTRIBUIÇÃO DE COMISSÕES (LIMITADO A 3 NÍVEIS)
CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_product RECORD;
    v_affiliate RECORD;
    v_master_affiliate_id uuid;
    v_master_user_id uuid;
    v_current_sponsor_id uuid;
    v_target_user_id uuid;
    
    v_config RECORD;
    v_config_key text;
    v_base_commission_pool numeric;
    v_commission_amount numeric;
    v_level_rate numeric;
    
    v_is_renewal boolean;
    v_gen_count integer;
    v_active_gens integer;
    
    v_sponsor_is_active boolean;
    v_sponsor_is_delinquent boolean;
    v_description text;
    v_category_name text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evita processamento de comissão duplicado para o mesmo pedido
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Buscar o afiliado que indicou a venda (Geração 1)
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
              AND organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Patrocinador registrado no perfil do comprador
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
              AND a.organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Se não achou nenhum afiliado na rede, não distribui comissão
        IF v_affiliate IS NULL THEN
            RETURN NEW;
        END IF;

        -- Buscar o ID Master da organização para redundância
        SELECT id, user_id INTO v_master_affiliate_id, v_master_user_id 
        FROM public.affiliates 
        WHERE organization_id = NEW.organization_id 
          AND (referral_code = 'master' OR sponsor_id IS NULL)
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_master_user_id IS NULL THEN
            SELECT id, user_id INTO v_master_affiliate_id, v_master_user_id 
            FROM public.affiliates 
            WHERE organization_id = NEW.organization_id
            ORDER BY created_at ASC 
            LIMIT 1;
        END IF;

        -- Iterar sobre os itens do pedido
        FOR v_item IN 
            SELECT product_id, product_name, unit_price, quantity 
            FROM public.order_items 
            WHERE order_id = NEW.id 
        LOOP
            -- Carregar dados do produto
            SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id;
            
            IF v_product IS NULL THEN
                CONTINUE;
            END IF;

            -- Buscar nome da categoria
            SELECT name INTO v_category_name 
            FROM public.product_categories 
            WHERE id = v_product.category_id;

            -- Inicializar valores
            v_base_commission_pool := 0;
            v_is_renewal := false;

            -- A. PRODUTO É UM PLANO DE ASSINATURA
            IF v_category_name = 'Planos' OR v_product.name ILIKE '%Telemedicina%' OR v_product.name ILIKE '%Assinatura%' THEN
                
                -- Verificar se é uma mensalidade (recorrência) ou adesão (primeira compra)
                SELECT EXISTS (
                    SELECT 1 
                    FROM public.order_items oi
                    JOIN public.orders o ON oi.order_id = o.id
                    JOIN public.products p ON oi.product_id = p.id
                    LEFT JOIN public.product_categories pc ON p.category_id = pc.id
                    WHERE o.user_id = NEW.user_id
                      AND o.status = 'Pago'
                      AND o.id != NEW.id
                      AND (pc.name = 'Planos' OR p.name ILIKE '%Telemedicina%' OR p.name ILIKE '%Assinatura%')
                ) INTO v_is_renewal;

                IF v_is_renewal THEN
                    v_base_commission_pool := COALESCE((v_product.variations->>'comissao_mensal')::numeric, 0);
                    v_config_key := 'plan_mensal';
                ELSE
                    v_base_commission_pool := COALESCE((v_product.variations->>'comissao_adesao')::numeric, 0);
                    v_config_key := 'plan_adesao';
                END IF;

                -- Fallback
                IF v_base_commission_pool IS NULL OR v_base_commission_pool = 0 THEN
                    v_base_commission_pool := v_item.unit_price * v_item.quantity;
                END IF;

            -- B. PRODUTO GERAL
            ELSE
                v_base_commission_pool := v_item.unit_price * v_item.quantity;
                v_config_key := 'geral';
            END IF;

            -- Carregar a configuração de comissões correspondente
            SELECT * INTO v_config FROM public.commission_configs 
            WHERE key = v_config_key AND organization_id = NEW.organization_id;
            
            IF v_config IS NULL THEN
                SELECT * INTO v_config FROM public.commission_configs 
                WHERE key = 'geral' AND organization_id = NEW.organization_id;
            END IF;

            IF v_config IS NULL OR v_base_commission_pool <= 0 THEN
                CONTINUE;
            END IF;

            v_active_gens := LEAST(v_config.active_generations, 3);
            v_gen_count := 0;
            v_current_sponsor_id := v_affiliate.id;

            -- Subir a rede de patrocinadores e distribuir comissões
            WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
                v_gen_count := v_gen_count + 1;

                SELECT (lvl->>'value')::numeric INTO v_level_rate
                FROM jsonb_array_elements(v_config.levels) AS lvl
                WHERE (lvl->>'level')::integer = v_gen_count;

                IF v_level_rate IS NOT NULL AND v_level_rate > 0 THEN
                    IF v_config.type = 'percent' THEN
                        v_commission_amount := v_base_commission_pool * (v_level_rate / 100.0);
                    ELSE
                        v_commission_amount := v_level_rate * v_item.quantity;
                    END IF;

                    IF v_commission_amount > 0 THEN
                        v_target_user_id := NULL;
                        v_sponsor_is_active := false;
                        v_sponsor_is_delinquent := false;

                        SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                        IF v_target_user_id IS NOT NULL THEN
                            SELECT is_active, is_delinquent 
                            INTO v_sponsor_is_active, v_sponsor_is_delinquent 
                            FROM public.user_profiles 
                            WHERE id = v_target_user_id;

                            IF v_sponsor_is_active = false OR v_sponsor_is_delinquent = true THEN
                                v_target_user_id := v_master_user_id;
                                v_description := 'Comissão MMN (Redirecionada ao Master devido a Patrocinador inativo/inadimplente) - Geração ' || v_gen_count || ' - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                            ELSE
                                v_description := 'Comissão MMN - Geração ' || v_gen_count || ' - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                            END IF;

                            -- Garantir carteira
                            INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance, frozen_balance, is_active_this_month, created_at, updated_at)
                            VALUES (v_target_user_id, NEW.organization_id, 0, 0, 0, true, now(), now())
                            ON CONFLICT (user_id) DO NOTHING;

                            -- Creditar saldo
                            UPDATE public.user_settings 
                            SET 
                                total_earnings = total_earnings + v_commission_amount,
                                available_balance = available_balance + v_commission_amount,
                                updated_at = now()
                            WHERE user_id = v_target_user_id;

                            -- Registrar histórico
                            INSERT INTO public.commissions (
                                organization_id,
                                user_id,
                                order_id,
                                amount,
                                level,
                                commission_type,
                                description
                            ) VALUES (
                                NEW.organization_id,
                                v_target_user_id,
                                NEW.id,
                                v_commission_amount,
                                v_gen_count,
                                v_config_key,
                                v_description
                            );
                        END IF;
                    END IF;
                END IF;

                SELECT sponsor_id INTO v_current_sponsor_id 
                FROM public.affiliates 
                WHERE id = v_current_sponsor_id 
                  AND organization_id = NEW.organization_id;
                
                IF v_gen_count >= 3 THEN EXIT; END IF;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Recriar o gatilho na tabela de pedidos
DROP TRIGGER IF EXISTS trigger_distribute_commissions ON public.orders;
CREATE TRIGGER trigger_distribute_commissions
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.distribute_commissions();


-- ============================================================================
-- ADICIONAR COLUNAS PARA SAQUE BANCÁRIO E RENOVAÇÃO AUTOMÁTICA
-- ============================================================================

-- 1. Alterar tabela de configurações do usuário (user_settings)
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS bank_document text,
ADD COLUMN IF NOT EXISTS auto_renew_subscription boolean DEFAULT true;

-- 2. Alterar tabela de saques (withdrawals)
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS bank_document text;

COMMENT ON COLUMN public.user_settings.auto_renew_subscription IS 'Indica se a renovação da mensalidade do EVA deve ser cobrada automaticamente';
COMMENT ON COLUMN public.withdrawals.payment_method IS 'Método de pagamento solicitado para o saque: pix ou bank_transfer';


-- ============================================================================
-- REMOVER SPONSOR FALLBACK E EXCEÇÕES SILENCIOSAS DO GATILHO DE CADASTRO
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
