# Índice único `patients_tenant_id_email_key`

O índice único em `patients(tenant_id, email)` já é criado pela migration **20260220000002_patient_email_unique_per_tenant** como índice **parcial** (`WHERE email IS NOT NULL`), permitindo vários pacientes sem e-mail no mesmo tenant.

O schema Prisma declara `@@unique([tenantId, email])` (único “completo”). O Prisma não suporta índice único parcial no schema, então às vezes gera uma nova migration tentando criar o mesmo índice. Se isso acontecer:

1. **Não** aceite a migration como está (vai falhar com "relation already exists").
2. Edite o SQL da nova migration e substitua o `CREATE UNIQUE INDEX` por:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'patients_tenant_id_email_key') THEN
    CREATE UNIQUE INDEX "patients_tenant_id_email_key" ON "patients"("tenant_id", "email");
  END IF;
END $$;
```

3. Marque a migration como rolled back e reaplique:
   ```bash
   npx prisma migrate resolve --rolled-back <nome_da_migration>
   npx prisma migrate deploy
   ```
