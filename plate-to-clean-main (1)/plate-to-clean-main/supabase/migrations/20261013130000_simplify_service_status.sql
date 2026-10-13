-- Consolida a antiga etapa EM_FINALIZACAO em EM_LAVAGEM, agora exibida como
-- "Em serviço", e simplifica o fluxo para EM_LAVAGEM -> FINALIZADO.

DROP TRIGGER IF EXISTS trg_orders_status_transition ON public.service_orders;

UPDATE public.service_orders
SET status = 'EM_LAVAGEM'
WHERE status = 'EM_FINALIZACAO';

CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE transition_allowed BOOLEAN := FALSE;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  transition_allowed := CASE
    WHEN OLD.status = 'AGUARDANDO' AND NEW.status IN ('EM_LAVAGEM', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'EM_LAVAGEM' AND NEW.status IN ('FINALIZADO', 'CANCELADO') THEN TRUE
    -- Compatibilidade durante atualizações em que ainda exista um registro legado.
    WHEN OLD.status = 'EM_FINALIZACAO' AND NEW.status IN ('FINALIZADO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'FINALIZADO' AND NEW.status IN ('AGUARDANDO_PAGAMENTO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'AGUARDANDO_PAGAMENTO' AND NEW.status IN ('PAGO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'PAGO' AND NEW.status = 'ENTREGUE' THEN TRUE
    ELSE FALSE
  END;

  IF NOT transition_allowed THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'CANCELADO' AND public.current_role() = 'EMPLOYEE' THEN
    RAISE EXCEPTION 'Apenas proprietário ou gerente podem cancelar.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.status = 'FINALIZADO' AND NEW.finished_at IS NULL THEN NEW.finished_at := now(); END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_status_transition
BEFORE UPDATE OF status ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_status_transition();
