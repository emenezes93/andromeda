import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["admin", "practitioner", "viewer"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "admin" | "practitioner" | "viewer";
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: string | undefined;
    role?: "admin" | "practitioner" | "viewer" | undefined;
}>;
export type CreateUserBody = z.infer<typeof createUserSchema>;
//# sourceMappingURL=schemas.d.ts.map