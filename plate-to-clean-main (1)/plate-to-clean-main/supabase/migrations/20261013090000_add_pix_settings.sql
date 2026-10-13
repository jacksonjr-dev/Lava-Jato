ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS pix_key TEXT,
  ADD COLUMN IF NOT EXISTS pix_receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS pix_city TEXT;

COMMENT ON COLUMN public.tenants.pix_key IS 'Chave PIX usada para gerar cobranças no portal do cliente.';
COMMENT ON COLUMN public.tenants.pix_receiver_name IS 'Nome do beneficiário exibido no pagamento PIX.';
COMMENT ON COLUMN public.tenants.pix_city IS 'Cidade do beneficiário exigida pelo padrão BR Code PIX.';
