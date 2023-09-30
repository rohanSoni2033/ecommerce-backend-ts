import express from 'express';
import productRouters from './routers/productRouters.js';
import authRouters from './routers/authRouters.js';
import { ErrorRequestHandler } from 'express';
import GlobalError from './utils/globalError.js';
import { statusCode } from './utils/constants.js';
const app = express();

app.use(express.json());

app.use('/api/auth', authRouters);
app.use('/api/products', productRouters);

app.use('*', (req, res, next) => {
  return next(
    new GlobalError(statusCode.NOT_FOUND, `${req.baseUrl} is not defined`)
  );
});

const errorRequestHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(err.statusCode).json({
    status: 'fail',
    error: err.error,
  });
};

app.use(errorRequestHandler);

export default app;
