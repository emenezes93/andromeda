import { z } from 'zod';
declare const envSchema: any;
export type Env = z.infer<typeof envSchema>;
export declare const env: z.infer<any>;
export {};
//# sourceMappingURL=env.d.ts.map