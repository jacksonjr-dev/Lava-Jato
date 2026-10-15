-- Catálogo padrão enxuto e regra de exclusividade entre os tipos de lavagem.

UPDATE public.services
SET nome = 'Lavagem simples (apenas externa)',
    descricao = 'Lavagem apenas da parte externa e secagem',
    updated_at = now()
WHERE lower(nome) = 'lavagem simples';

UPDATE public.services
SET nome = 'Lavagem completa (externa e interna)',
    descricao = 'Lavagem externa e limpeza da parte interna',
    updated_at = now()
WHERE lower(nome) = 'lavagem completa';

UPDATE public.services
SET ativo = FALSE, updated_at = now()
WHERE lower(nome) IN ('lavagem premium', 'higienização interna', 'enceramento');

CREATE OR REPLACE FUNCTION public.prevent_multiple_washes_per_order()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.nome ILIKE 'Lavagem simples%' OR NEW.nome ILIKE 'Lavagem completa%' THEN
    IF EXISTS (
      SELECT 1
      FROM public.service_order_items item
      WHERE item.order_id = NEW.order_id
        AND item.id IS DISTINCT FROM NEW.id
        AND (item.nome ILIKE 'Lavagem simples%' OR item.nome ILIKE 'Lavagem completa%')
    ) THEN
      RAISE EXCEPTION 'Escolha apenas uma lavagem: simples ou completa.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_one_wash_per_order ON public.service_order_items;
CREATE TRIGGER trg_one_wash_per_order
BEFORE INSERT OR UPDATE OF nome, order_id ON public.service_order_items
FOR EACH ROW EXECUTE FUNCTION public.prevent_multiple_washes_per_order();

CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
  p_tenant_id UUID, p_nome TEXT, p_telefone TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL, p_logo_url TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Você já possui um lava-jato vinculado.';
  END IF;
  IF length(trim(COALESCE(p_nome, ''))) < 2 THEN
    RAISE EXCEPTION 'Informe o nome do lava-jato.';
  END IF;

  INSERT INTO public.tenants (id, nome, telefone, endereco, logo_url)
  VALUES (p_tenant_id, trim(p_nome), nullif(trim(p_telefone), ''),
          nullif(trim(p_endereco), ''), nullif(trim(p_logo_url), ''));
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (p_tenant_id, current_user_id, 'OWNER');
  INSERT INTO public.services (tenant_id, nome, preco, duracao_min, descricao) VALUES
    (p_tenant_id, 'Lavagem simples (apenas externa)', 35, 30,
     'Lavagem apenas da parte externa e secagem'),
    (p_tenant_id, 'Lavagem completa (externa e interna)', 60, 60,
     'Lavagem externa e limpeza da parte interna'),
    (p_tenant_id, 'Polimento', 150, 180, 'Polimento técnico da pintura');
  RETURN p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
