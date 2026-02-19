declare module 'speakeasy' {
  export interface GeneratedSecret {
    ascii?: string;
    hex?: string;
    base32?: string;
    otpauth_url?: string;
  }

  export function generateSecret(options: {
    name: string;
    issuer: string;
    length?: number;
  }): GeneratedSecret;

  export namespace totp {
    export function verify(options: {
      secret: string;
      encoding: string;
      token: string;
      window?: number;
    }): boolean;
  }
}
