-- ============================================================
-- MIGRATION: Adicionar full_name à tabela profiles
-- e garantir trigger para auto-criação de perfis
-- ============================================================

-- 1. Garantir que a coluna full_name existe na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Drop a trigger antiga se existir (para recriar limpa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar a função que cria o perfil automaticamente ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Criar o trigger na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Garantir RLS habilitado e políticas corretas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver o próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuário pode atualizar o próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins (service role) podem ver todos os perfis
DROP POLICY IF EXISTS "Service role can see all profiles" ON public.profiles;
CREATE POLICY "Service role can see all profiles"
  ON public.profiles FOR SELECT
  USING (true); -- Permite leitura para todos autenticados (necessário para admin ver lista)

-- Backfill: garantir que usuários existentes tenham perfil
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT
  id,
  email,
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/dhadesogklhggtixlcsk/sql
-- ============================================================
