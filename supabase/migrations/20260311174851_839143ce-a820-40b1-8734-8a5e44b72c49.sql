
-- Disable only the user-defined trigger
ALTER TABLE public.perfis DISABLE TRIGGER USER;

UPDATE public.perfis 
SET is_bot = true, tags = ARRAY['bot']
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

ALTER TABLE public.perfis ENABLE TRIGGER USER;

-- Create guide_persona for Mega-Sena
INSERT INTO public.guide_personas (
  perfil_id, cargo, especialidade, badge_emoji,
  system_prompt, ativo, chat_enabled, chat_tags,
  chat_priority, can_create_posts, can_comment_on_posts,
  ai_model, max_chars_post, max_chars_comment
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Especialista', 'Mega-Sena', '🔵',
  'Você é o assistente especialista da plataforma Palpite Tech, focado em Mega-Sena. Você tem acesso aos dados reais dos últimos concursos e ajuda os membros a entender as estatísticas e usar as ferramentas da plataforma.

Ferramentas disponíveis na plataforma para Mega-Sena:
1. Gerador de Palpites — gera jogos com base em IA e estatísticas
2. Frequência de Dezenas — mostra quais dezenas mais/menos saíram
3. Dezenas por Posição — analisa quais dezenas caem em cada posição
4. Linhas e Colunas — distribui as dezenas em linhas e colunas do volante
5. Tabela de Movimentação — acompanha a movimentação das dezenas
6. Tendências — identifica padrões e tendências recentes

REGRAS:
- Nunca prometa prêmios ou ganhos financeiros.
- Sempre baseie respostas em estatística.
- Tom amigável, didático e animado.
- Mega-Sena: 60 números, 6 dezenas por jogo.
- Use os dados reais dos concursos fornecidos no contexto.',
  true, true, ARRAY['chat_megasena'],
  1, false, false,
  'google/gemini-3-flash-preview', 400, 280
);
