-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO: PONTA D'FACA CHARCUTARIA
-- ============================================================================

-- 1. CRIAÇÃO DA TABELA DE FILA DE ESPERA (LISTA DE ESPERA)
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

-- Habilitar RLS (Row Level Security) na fila de espera
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para fila de espera
-- Qualquer visitante pode se cadastrar
CREATE POLICY "Permitir inserção pública na lista de espera" 
    ON public.waiting_list FOR INSERT 
    WITH CHECK (true);

-- Apenas administradores podem ler ou atualizar a fila de espera
CREATE POLICY "Permitir leitura para admins" 
    ON public.waiting_list FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid() 
              AND user_profiles.role IN ('admin_master', 'admin_op')
        )
    );

CREATE POLICY "Permitir atualização para admins" 
    ON public.waiting_list FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid() 
              AND user_profiles.role IN ('admin_master', 'admin_op')
        )
    );

-- 2. ADICIONAR MODELO DE FATURAMENTO / NOTA FISCAL NAS EMPRESAS (PDVs)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_model text DEFAULT 'centralized' 
    CONSTRAINT check_billing_model CHECK (billing_model IN ('centralized', 'consigned'));

COMMENT ON COLUMN public.companies.billing_model IS 'Modelo de faturamento: centralized (Ponta DFaca emite NF) ou consigned (PDV emite NF)';
