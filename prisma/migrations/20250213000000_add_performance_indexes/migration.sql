-- CreateIndex
CREATE INDEX "memberships_tenant_id_idx" ON "memberships"("tenant_id");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "anamnesis_templates_tenant_id_created_at_idx" ON "anamnesis_templates"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "anamnesis_sessions_tenant_id_created_at_idx" ON "anamnesis_sessions"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "anamnesis_sessions_tenant_id_status_idx" ON "anamnesis_sessions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "anamnesis_sessions_template_id_idx" ON "anamnesis_sessions"("template_id");

-- CreateIndex
CREATE INDEX "anamnesis_answers_session_id_created_at_idx" ON "anamnesis_answers"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "anamnesis_answers_tenant_id_idx" ON "anamnesis_answers"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_idx" ON "ai_insights"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_created_at_idx" ON "audit_log"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_action_idx" ON "audit_log"("tenant_id", "action");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_entity_idx" ON "audit_log"("tenant_id", "entity");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log"("actor_user_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_created_at_idx" ON "idempotency_keys"("created_at");
