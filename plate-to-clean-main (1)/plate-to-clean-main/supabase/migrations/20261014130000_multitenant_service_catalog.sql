-- Catálogo de serviços personalizável e isolado por empresa.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'ADICIONAL';

UPDATE public.services
SET categoria = 'LAVAGEM'
WHERE nome ILIKE 'Lavagem%';

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_categoria_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_categoria_check
  CHECK (categoria IN ('LAVAGEM', 'ADICIONAL'));

CREATE OR REPLACE FUNCTION public.prevent_multiple_washes_per_order()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE service_category TEXT;
BEGIN
  SELECT categoria INTO service_category
  FROM public.services
  WHERE id = NEW.service_id AND tenant_id = NEW.tenant_id;

  IF service_category = 'LAVAGEM' THEN
    IF EXISTS (
      SELECT 1
      FROM public.service_order_items item
      JOIN public.services service
        ON service.id = item.service_id AND service.tenant_id = item.tenant_id
      WHERE item.tenant_id = NEW.tenant_id
        AND item.order_id = NEW.order_id
        AND item.id IS DISTINCT FROM NEW.id
        AND service.categoria = 'LAVAGEM'
    ) THEN
      RAISE EXCEPTION 'Escolha apenas uma opção da categoria lavagem.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_one_wash_per_order ON public.service_order_items;
CREATE TRIGGER trg_one_wash_per_order
BEFORE INSERT OR UPDATE OF service_id, order_id, tenant_id ON public.service_order_items
FOR EACH ROW EXECUTE FUNCTION public.prevent_multiple_washes_per_order();

CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
  p_tenant_id UUID, p_nome TEXT, p_telefone TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL, p_logo_url TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_user_id UUID := auth.uid();
  generated_slug TEXT;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Você já possui um lava-jato vinculado.';
  END IF;
  IF length(trim(COALESCE(p_nome, ''))) < 2 THEN
    RAISE EXCEPTION 'Informe o nome do lava-jato.';
  END IF;

  generated_slug := concat(
    coalesce(nullif(public.tenant_slug_base(p_nome), ''), 'lava-jato'),
    '-',
    left(replace(p_tenant_id::text, '-', ''), 8)
  );

  INSERT INTO public.tenants (id, nome, telefone, endereco, logo_url, slug, public_listing)
  VALUES (p_tenant_id, trim(p_nome), nullif(trim(p_telefone), ''),
          nullif(trim(p_endereco), ''), nullif(trim(p_logo_url), ''), generated_slug, TRUE);
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (p_tenant_id, current_user_id, 'OWNER');
  INSERT INTO public.services
    (tenant_id, nome, preco, duracao_min, descricao, categoria)
  VALUES
    (p_tenant_id, 'Lavagem simples (apenas externa)', 35, 30,
     'Lavagem apenas da parte externa e secagem', 'LAVAGEM'),
    (p_tenant_id, 'Lavagem completa (externa e interna)', 60, 60,
     'Lavagem externa e limpeza da parte interna', 'LAVAGEM'),
    (p_tenant_id, 'Polimento', 150, 180, 'Polimento técnico da pintura', 'ADICIONAL');
  RETURN p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON COLUMN public.services.categoria IS
  'LAVAGEM permite somente uma opção por ordem; ADICIONAL pode ser combinado.';
