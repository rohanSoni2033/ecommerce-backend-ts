import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getSingleProduct,
  deleteMultipleProducts,
  deleteSingleProduct,
  updateSingleProduct,
  updateMultipleProducts,
} from '../controllers/productController.js';

import {
  createVariation,
  deleteVariation,
  getAllVariations,
  updateSingleVariation,
} from '../controllers/variationsController.js';

const router = Router();

router
  .route('/')
  .get(getProducts)
  .post(createProduct)
  .delete(deleteMultipleProducts)
  .patch(updateMultipleProducts);

router
  .route('/:productId')
  .get(getSingleProduct)
  .delete(deleteSingleProduct)
  .patch(updateSingleProduct);

router
  .route('/:productId/variations')
  .post(createVariation)
  .get(getAllVariations)
  .delete(deleteVariation);

router
  .route('/:productId/variations/:variationId')
  .patch(updateSingleVariation);

export default router;
