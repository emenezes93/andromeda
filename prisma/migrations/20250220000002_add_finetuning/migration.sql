-- Add fine-tuning model configuration to templates
ALTER TABLE "anamnesis_templates" ADD COLUMN IF NOT EXISTS "llm_finetuned_model" TEXT; -- Custom fine-tuned model ID for this template
