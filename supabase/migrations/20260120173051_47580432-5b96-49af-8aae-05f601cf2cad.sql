-- =============================================================================
-- LOTOFÁCIL SaaS - Migração Completa do Banco de Dados
-- =============================================================================

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar ENUM para roles do sistema
CREATE TYPE public.app_role AS ENUM ('user', 'premium', 'moderator', 'admin');

-- =============================================================================
-- TABELA: user_roles (Sistema de Permissões Seguro)
-- =============================================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Apenas admins podem gerenciar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- TABELA: perfis (Dados do Usuário)
-- =============================================================================
CREATE TABLE public.perfis (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT,
    celular TEXT UNIQUE,
    email_verificado BOOLEAN DEFAULT false,
    celular_verificado BOOLEAN DEFAULT false,
    is_bot BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfis
CREATE POLICY "Perfis são visíveis para todos"
ON public.perfis FOR SELECT
USING (true);

CREATE POLICY "Usuários podem criar seu próprio perfil"
ON public.perfis FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.perfis FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_perfil_updated
BEFORE UPDATE ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TABELA: resultados (Histórico de Concursos)
-- =============================================================================
CREATE TABLE public.resultados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concurso_id INT UNIQUE NOT NULL,
    data_sorteio DATE NOT NULL,
    dezenas INT[] NOT NULL,
    
    -- Análises Matemáticas
    qtd_pares INT,
    qtd_impares INT,
    qtd_moldura INT,
    qtd_primos INT,
    qtd_repetidas INT,
    ciclo_numero INT,
    
    -- Informações Financeiras
    acumulou BOOLEAN DEFAULT false,
    valor_estimado_proximo DECIMAL(15, 2),
    valor_acumulado_especial DECIMAL(15, 2),
    
    -- Premiação e Geografia (JSONB para flexibilidade)
    premiacao_json JSONB,
    locais_ganhadores JSONB,
    local_sorteio TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX idx_resultados_concurso ON public.resultados(concurso_id DESC);
CREATE INDEX idx_resultados_data ON public.resultados(data_sorteio DESC);
CREATE INDEX idx_resultados_ciclo ON public.resultados(ciclo_numero);

-- Políticas RLS para resultados
CREATE POLICY "Resultados são públicos para leitura"
ON public.resultados FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem inserir resultados"
ON public.resultados FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar resultados"
ON public.resultados FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar resultados"
ON public.resultados FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- TABELA: postagens (Comunidade)
-- =============================================================================
CREATE TABLE public.postagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    conteudo TEXT NOT NULL,
    concurso_referencia INT REFERENCES public.resultados(concurso_id),
    tipo VARCHAR(20) DEFAULT 'comentario' CHECK (tipo IN ('comentario', 'palpite', 'analise')),
    curtidas INT DEFAULT 0,
    respostas_count INT DEFAULT 0,
    parent_id UUID REFERENCES public.postagens(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.postagens ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX idx_postagens_user ON public.postagens(user_id);
CREATE INDEX idx_postagens_created ON public.postagens(created_at DESC);
CREATE INDEX idx_postagens_concurso ON public.postagens(concurso_referencia);
CREATE INDEX idx_postagens_parent ON public.postagens(parent_id);

-- Políticas RLS para postagens
CREATE POLICY "Postagens são visíveis para todos"
ON public.postagens FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem criar postagens"
ON public.postagens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas próprias postagens"
ON public.postagens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias postagens"
ON public.postagens FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Moderadores e admins podem deletar qualquer postagem
CREATE POLICY "Moderadores podem deletar postagens"
ON public.postagens FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'moderator') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Trigger para atualizar updated_at em postagens
CREATE TRIGGER on_postagem_updated
BEFORE UPDATE ON public.postagens
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- HABILITAR REALTIME PARA POSTAGENS
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.postagens;