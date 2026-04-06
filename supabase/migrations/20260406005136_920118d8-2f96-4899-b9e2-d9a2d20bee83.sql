-- Users can read their own carteira_movimentacoes
CREATE POLICY "Users can view own carteira_movimentacoes"
ON public.carteira_movimentacoes
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Users can read their own bolao_cotas
CREATE POLICY "Users can view own bolao_cotas"
ON public.bolao_cotas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can read their own bolao_resgates
CREATE POLICY "Users can view own bolao_resgates"
ON public.bolao_resgates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);