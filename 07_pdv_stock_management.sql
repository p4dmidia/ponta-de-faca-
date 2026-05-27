-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO: PONTA D'FACA CHARCUTARIA
-- GESTÃO DE ESTOQUES DE PDV & REPOSIÇÃO
-- ============================================================================

-- Adiciona colunas para controle de estoque e reposição na tabela de empresas (PDVs)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 15 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS min_stock_limit integer DEFAULT 5 NOT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reorder_status text DEFAULT 'none' NOT NULL 
    CONSTRAINT check_reorder_status CHECK (reorder_status IN ('none', 'pending', 'completed'));

-- Comentários das novas colunas
COMMENT ON COLUMN public.companies.stock_quantity IS 'Quantidade atual de combos de carne defumada em estoque no PDV';
COMMENT ON COLUMN public.companies.min_stock_limit IS 'Limite mínimo de estoque para disparar alertas de reposição';
COMMENT ON COLUMN public.companies.reorder_status IS 'Status da solicitação de reposição: none (nenhuma), pending (pendente), completed (concluída)';
