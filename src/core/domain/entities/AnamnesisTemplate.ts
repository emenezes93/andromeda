/**
 * Domain Entity: AnamnesisTemplate
 */
export class AnamnesisTemplate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly version: number,
    public readonly schemaJson: unknown,
    public readonly llmPrompt: string | null,
    public readonly llmFinetunedModel: string | null,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null = null
  ) {}

  isActive(): boolean {
    return this.deletedAt === null;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  hasConditionalLogic(): boolean {
    if (!this.schemaJson || typeof this.schemaJson !== 'object') return false;
    const obj = this.schemaJson as Record<string, unknown>;
    const logic = obj.conditionalLogic;
    return Array.isArray(logic) && logic.length > 0;
  }
}
