-- Identidade pública e inequívoca de cada empresa da plataforma.
-- Dados operacionais continuam protegidos por tenant_id e RLS.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS public_listing BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS web_push_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.tenant_slug_base(value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(BOTH '-' FROM regexp_replace(
    lower(translate(coalesce(value, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g'));
$$;

UPDATE public.tenants
SET slug = concat(
  coalesce(nullif(public.tenant_slug_base(nome), ''), 'lava-jato'),
  '-',
  left(replace(id::text, '-', ''), 8)
)
WHERE slug IS NULL OR trim(slug) = '';

ALTER TABLE public.tenants ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique ON public.tenants (slug);
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_slug_format_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_slug_format_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

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
  INSERT INTO public.services (tenant_id, nome, preco, duracao_min, descricao) VALUES
    (p_tenant_id, 'Lavagem simples (apenas externa)', 35, 30,
     'Lavagem apenas da parte externa e secagem'),
    (p_tenant_id, 'Lavagem completa (externa e interna)', 60, 60,
     'Lavagem externa e limpeza da parte interna'),
    (p_tenant_id, 'Polimento', 150, 180, 'Polimento técnico da pintura');
  RETURN p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.tenant_slug_base(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_slug_base(TEXT) TO service_role;

-- Cada empresa conecta seus próprios provedores. Segredos ficam no cofre/ambiente
-- e a tabela guarda apenas uma referência, nunca o token em texto puro.
CREATE TABLE IF NOT EXISTS public.tenant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED'
    CHECK (status IN ('DISCONNECTED', 'PENDING', 'CONNECTED', 'ERROR')),
  public_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_integrations_select ON public.tenant_integrations;
CREATE POLICY tenant_integrations_select ON public.tenant_integrations
  FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager());
DROP POLICY IF EXISTS tenant_integrations_write ON public.tenant_integrations;
CREATE POLICY tenant_integrations_write ON public.tenant_integrations
  FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager())
  WITH CHECK (tenant_id = app.current_tenant() AND app.is_manager());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_integrations TO authenticated;
GRANT ALL ON public.tenant_integrations TO service_role;

-- Outbox transacional: a API externa processará cada evento uma única vez.
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'WEB_PUSH', 'EMAIL', 'SMS')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT notification_order_same_tenant_fkey
    FOREIGN KEY (tenant_id, order_id)
    REFERENCES public.service_orders(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT notification_customer_same_tenant_fkey
    FOREIGN KEY (tenant_id, customer_id)
    REFERENCES public.customers(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, order_id, event_type, channel)
);

CREATE INDEX IF NOT EXISTS notification_outbox_pending_idx
  ON public.notification_outbox (status, available_at)
  WHERE status IN ('PENDING', 'FAILED');

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_outbox_select ON public.notification_outbox;
CREATE POLICY notification_outbox_select ON public.notification_outbox
  FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager());

GRANT SELECT ON public.notification_outbox TO authenticated;
GRANT ALL ON public.notification_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_order_ready_notifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status = 'AGUARDANDO_PAGAMENTO'
     AND NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.notification_outbox
      (tenant_id, order_id, customer_id, event_type, channel, payload)
    SELECT NEW.tenant_id, NEW.id, NEW.customer_id, 'ORDER_READY', preference.channel,
      jsonb_build_object('vehicle_id', NEW.vehicle_id, 'order_number', NEW.numero)
    FROM public.customers customer
    CROSS JOIN LATERAL (VALUES
      ('WHATSAPP', customer.whatsapp_opt_in),
      ('WEB_PUSH', customer.web_push_opt_in)
    ) AS preference(channel, enabled)
    WHERE customer.tenant_id = NEW.tenant_id
      AND customer.id = NEW.customer_id
      AND preference.enabled
    ON CONFLICT (tenant_id, order_id, event_type, channel) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_order_ready_notifications ON public.service_orders;
CREATE TRIGGER trg_enqueue_order_ready_notifications
AFTER UPDATE OF status ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.enqueue_order_ready_notifications();

REVOKE ALL ON FUNCTION public.enqueue_order_ready_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_order_ready_notifications() TO service_role;
