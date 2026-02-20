-- 1. CPF único por tenant (remover unique global, adicionar unique (tenant_id, cpf))
-- Primeiro remove o índice/constraint único em cpf (nome pode variar por versão do Prisma)
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_cpf_key;
CREATE UNIQUE INDEX IF NOT EXISTS patients_tenant_id_cpf_key ON patients(tenant_id, cpf) WHERE cpf IS NOT NULL;

-- 2. AuditLog append-only: trigger que impede UPDATE e DELETE
CREATE OR REPLACE FUNCTION prevent_audit_log_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_log is append-only: updates are not allowed';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_log is append-only: deletes are not allowed';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_append_only_trigger ON audit_log;
CREATE TRIGGER audit_log_append_only_trigger
  AFTER UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE PROCEDURE prevent_audit_log_update_delete();
