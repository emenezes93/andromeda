/**
 * Type declarations for optional dependencies (bullmq, ioredis).
 * Ensures the project builds even when types are not resolved from node_modules.
 */
declare module 'ioredis' {
  interface RedisOptions {
    maxRetriesPerRequest?: number | null;
  }
  class Redis {
    constructor(urlOrOptions?: string | RedisOptions);
    get(key: string): Promise<string | null>;
    setex(key: string, ttl: number, value: string): Promise<string>;
    quit(): Promise<string>;
  }
  export = Redis;
}

declare module 'bullmq' {
  export interface Job<T = unknown> {
    id?: string;
    data: T;
  }
  export interface QueueOptions {
    connection?: { host?: string; port?: number } | object;
    defaultJobOptions?: {
      removeOnComplete?: { count?: number };
      attempts?: number;
      backoff?: { type?: string; delay?: number };
    };
  }
  export interface WorkerOptions {
    connection?: object;
    concurrency?: number;
  }
  export class Queue<T = unknown> {
    constructor(name: string, opts?: QueueOptions);
    add(jobName: string, data: T, opts?: { repeat?: { pattern: string }; jobId?: string }): Promise<unknown>;
    close(): Promise<void>;
  }
  export class Worker<T = unknown> {
    constructor(
      name: string,
      processor: (job: Job<T>) => Promise<unknown>,
      opts?: WorkerOptions
    );
    on(event: 'failed', fn: (job: Job<T> | undefined, err: Error) => void): void;
    on(event: string, fn: (...args: unknown[]) => void): void;
    close(): Promise<void>;
  }
}
