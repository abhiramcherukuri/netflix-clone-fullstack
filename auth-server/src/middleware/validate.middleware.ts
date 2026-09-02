import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';

/**
 * Validates request body against a Zod schema before the controller runs.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    req.body = await schema.parseAsync(req.body);
    next();
  };
