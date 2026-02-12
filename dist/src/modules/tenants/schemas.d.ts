import { z } from 'zod';
export declare const createTenantSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "suspended"]>>>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "suspended";
    name: string;
}, {
    name: string;
    status?: "active" | "suspended" | undefined;
}>;
export type CreateTenantBody = z.infer<typeof createTenantSchema>;
//# sourceMappingURL=schemas.d.ts.map