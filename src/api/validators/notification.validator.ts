import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
    page: z.string().optional().transform(val => parseInt(val || '1')),
    limit: z.string().optional().transform(val => parseInt(val || '10')),
    onlyUnread: z.string().optional().transform(val => val === 'true')
});