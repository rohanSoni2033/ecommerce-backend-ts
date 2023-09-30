import asyncHandler from '../utils/asyncHandler.js';
import { ObjectId } from 'mongodb';
import db from '../database/db.js';
import { collections, responseStatus, statusCode } from '../utils/constants.js';
import Validate from '../utils/validate.js';
import GlobalError from '../utils/globalError.js';

const validateCreateProduct = (body: any) => {
  const validate = new Validate(body)
    .field('title')
    .required('Please enter the product title')
    .isString('product title must be a string')
    .validate(
      title => title.length <= 240,
      'Title must be smaller than equal to 100 letters'
    )
    .field('categoryId')
    .required('Please add the category')
    .field('description')
    .required('please add the description')
    .isString('description must be a string')
    .field('brand')
    .required('Brand name is required')
    .isString('Brand name must be a string');

  return validate;
};

export const createProduct = asyncHandler(async (req, res, next) => {
  const validate = validateCreateProduct(req.body);

  if (validate.errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, validate.errors));
  }

  const { insertedId } = await db()
    .collection('products')
    .insertOne({
      ...validate.data,
      active: false,
      createdAt: new Date(),
    });

  res.status(statusCode.CREATED).json({
    status: 'success',
  });
});

export const getProducts = asyncHandler(async (req, res, next) => {
  const query = req.query;

  const validate = new Validate(query)
    .field('sort')
    .field('filter')
    .field('limit');

  const products = await db()
    ?.collection(collections.PRODUCTS)
    ?.find(
      {},
      {
        projection: {
          _id: 1,
          title: 1,
          productImages: 1,
          brand: 1,
          categoryId: 1,
        },
      }
    )
    .toArray();

  res.status(200).json({
    status: responseStatus.SUCCESS,
    data: {
      length: products?.length,
      products,
    },
  });
});

export const getSingleProduct = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;

  const singleProduct = await db()
    ?.collection(collections.PRODUCTS)
    ?.findOne({
      _id: new ObjectId(productId),
    });

  res.status(200).json({
    status: responseStatus.SUCCESS,
    data: {
      product: singleProduct,
    },
  });
});

export const deleteSingleProduct = asyncHandler(async (req, res, next) => {
  const result = await db()
    .collection('products')
    .deleteOne({
      _id: new ObjectId(req.params.productId),
    });

  res.status(statusCode.OK).json({
    status: 'success',
    message: 'product is deleted',
  });
});

export const deleteMultipleProducts = asyncHandler(async (req, res, next) => {
  const productIds = req.body.productIds;

  const result = await db().collection('products').deleteMany();
});

export const updateSingleProduct = asyncHandler(async (req, res, next) => {
  const validate = new Validate(req.body)
    .field('title')
    .isString('product title must be a string')
    .validate(
      title => title.length <= 240,
      'Title must be smaller than equal to 100 letters'
    )
    .field('categoryId')
    .isString('description must be a string')
    .field('description')
    .isString('description must be a string')
    .field('brand')
    .isString('Brand name must be a string')
    .field('regularPrice')
    .isNumber('regular price must be a number')
    .field('discount')
    .isNumber('discount must be a number')
    .field('discountPrice')
    .isNumber('discount price must be a number')
    .field('salePrice')
    .isNumber('sale price must be a number')
    .field('available')
    .isBoolean('Available must be a boolean')
    .field('stockQuantity')
    .isNumber('stock quantity must be a number')
    .validate(
      stockQuantity => stockQuantity >= 0,
      'Provide a valid stock quantity'
    )
    .field('specifications')
    .isArray('specifications must be an array')
    .isArrayEmpty('at least add one specification')
    .field('dimensions')
    .isArray('dimension must be an array')
    .isArrayEmpty('at least add one dimension')
    .field('features')
    .isArray('features must be an array')
    .isArrayEmpty('add at least one feature');

  const result = await db()
    .collection('products')
    .updateOne(
      {
        _id: new ObjectId(req.params.productId),
      },
      { $set: validate.data }
    );
});

export const updateMultipleProducts = asyncHandler(
  async (req, res, next) => {}
);
