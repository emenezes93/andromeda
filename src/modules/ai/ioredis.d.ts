/**
 * Type declaration for optional ioredis module.
 * This allows the code to compile even if ioredis is not installed.
 */
declare module 'ioredis' {
  export default class Redis {
    constructor(url: string);
    on(event: string, handler: (err?: Error) => void): void;
    ping(): Promise<string>;
    get(key: string): Promise<string | null>;
    setex(key: string, ttl: number, value: string): Promise<string>;
    keys(pattern: string): Promise<string[]>;
    del(...keys: string[]): Promise<number>;
  }
}
