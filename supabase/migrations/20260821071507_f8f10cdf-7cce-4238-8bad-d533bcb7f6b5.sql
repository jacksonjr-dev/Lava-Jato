DELETE FROM public.payments p
USING public.payments q
WHERE p.order_id = q.order_id
  AND (q.pago_em < p.pago_em OR (q.pago_em = p.pago_em AND q.id < p.id));

CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_unique ON public.payments (order_id);