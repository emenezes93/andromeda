/**
 * Value object: a single answer in a session
 */
export class SessionAnswer {
  constructor(
    public readonly questionId: string,
    public readonly value: unknown,
    public readonly answeredAt: Date
  ) {}
}
