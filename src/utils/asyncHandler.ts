import { Request, Response, NextFunction } from 'express';
import GlobalError from './globalError.js';
import { statusCode } from './constants.js';
import handlerError from '../controllers/errors.js';

const asyncHandler = (
  callback: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await callback(req, res, next);
    } catch (err: any) {
      handlerError(err, res);
    }
  };
};

export default asyncHandler;
