import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { BadRequestError } from '../../common/errors';

export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[source];
            const validatedData = schema.parse(data);
            req[source] = validatedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.errors.reduce((acc: Record<string, string>, curr) => {
                    const path = curr.path.join('.');
                    acc[path] = curr.message;
                    return acc;
                }, {});

                next(new BadRequestError('Validation failed', validationErrors));
            } else {
                next(error);
            }
        }
    };
};
