import { z } from 'zod';
export declare const loginBodySchema: any;
export declare const registerBodySchema: any;
export declare const refreshBodySchema: any;
export declare const logoutBodySchema: any;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
//# sourceMappingURL=schemas.d.ts.map