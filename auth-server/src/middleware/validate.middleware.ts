import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Validates request data (body, params, or query) against a Zod schema before the controller runs.
 */
export const validate =
  (schema: ZodTypeAny, target: 'body' | 'params' | 'query' = 'body') =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const validated = await schema.parseAsync(req[target]);
    if (target === 'body') {
      req.body = validated;
    }
    next();
  };
