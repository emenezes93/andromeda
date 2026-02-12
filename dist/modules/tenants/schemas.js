import { z } from 'zod';
export const createTenantSchema = z.object({
    name: z.string().min(1).max(255),
    status: z.enum(['active', 'suspended']).optional().default('active'),
});
//# sourceMappingURL=schemas.js.map