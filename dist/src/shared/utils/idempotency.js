import { createHash } from 'node:crypto';
import { ConflictError } from '../errors/index.js';
const HEADER_KEY = 'idempotency-key';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export function getRequestHash(req) {
    const body = req.body ?? {};
    const sorted = JSON.stringify(body, Object.keys(body).sort());
    return createHash('sha256').update(req.method + req.url + sorted).digest('hex');
}
export function getIdempotencyKey(req) {
    return req.headers[HEADER_KEY];
}
export async function withIdempotency(prisma, tenantId, key, requestHash, handler) {
    const existing = await prisma.idempotencyKey.findUnique({
        where: { tenantId_key: { tenantId, key } },
    });
    if (existing) {
        const age = Date.now() - existing.createdAt.getTime();
        if (age > IDEMPOTENCY_TTL_MS) {
            // Key expired — delete and reprocess
            await prisma.idempotencyKey.delete({
                where: { tenantId_key: { tenantId, key } },
            });
        }
        else {
            if (existing.requestHash !== requestHash) {
                throw new ConflictError('Idempotency key reused with different request body');
            }
            return {
                response: existing.responseJson,
                statusCode: existing.statusCode,
                fromCache: true,
            };
        }
    }
    const { response, statusCode } = await handler();
    await prisma.idempotencyKey.create({
        data: {
            tenantId,
            key,
            requestHash,
            responseJson: response,
            statusCode,
        },
    });
    return { response, statusCode, fromCache: false };
}
export function idempotencyKeyOptionalSchema() {
    return { [HEADER_KEY]: { type: 'string', description: 'Optional idempotency key for safe retries' } };
}
//# sourceMappingURL=idempotency.js.map