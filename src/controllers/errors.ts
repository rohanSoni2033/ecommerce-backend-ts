import { Response } from 'express';
import { statusCode } from '../utils/constants.js';

const handlerError = (err: any, res: Response) => {
  console.log(err);
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      const key = Object.keys(err.keyValue)[0];
      const value = err.keyValue[key];
      // Mobile number already in use, please use another
      res.status(statusCode.BAD_REQUEST).json({
        status: 'fail',
        message: 'Please use another mobile number',
      });
    }
  }
};

export default handlerError;
