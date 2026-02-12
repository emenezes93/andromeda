import { z } from 'zod';
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export function paginate(items, total, page, limit) {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
        data: items,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };
}
export function skipFor(page, limit) {
    return (page - 1) * limit;
}
//# sourceMappingURL=pagination.js.map