import { ObjectId } from 'mongodb';
import db from '../database/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import Validate from '../utils/validate.js';
import { statusCode } from '../utils/constants.js';

type Attribute = {
  title: string;
  type: string;
  options: { name: string }[];
};

const generateVariations = (
  attributes: Attribute[],
  index: number = 0,
  currentVariation: any = {},
  variations: any = []
) => {
  if (index === attributes.length) {
    variations.push({ _id: new ObjectId(), ...currentVariation });
    return;
  }

  const attribute = attributes[index];

  for (const option of attribute.options) {
    currentVariation[attribute.type] = option.name;
    generateVariations(attributes, index + 1, currentVariation, variations);
  }

  return variations;
};

export const getAllVariations = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;

  const variations = await db()
    .collection('products')
    .findOne(
      { _id: new ObjectId(productId) },
      {
        projection: {
          _id: 0,
          variations: 1,
        },
      }
    );

  res.status(statusCode.OK).json({
    status: 'success',
    data: variations,
  });
});

export const createVariation = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;

  const validate = new Validate(req.body)
    .field('attributes')
    .required('Please provide the attributes')
    .isArray('attribute must be an array')
    .isArrayEmpty('add at least one attribute');

  const variations = generateVariations(validate.data.attributes);

  const result = await db()
    .collection('products')
    .findOneAndUpdate(
      { _id: new ObjectId(productId) },
      {
        $set: {
          variations,
          attributes: validate.data,
        },
      }
    );

  res.status(statusCode.OK).json({ status: 'success', product: result.value });
});

export const getVariation = asyncHandler(async (req, res, next) => {});

export const deleteVariation = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;

  const result = await db()
    .collection('products')
    .updateOne(
      {
        _id: new ObjectId(productId),
      },
      {
        $unset: {
          attribute: 1,
          variations: 1,
        },
      }
    );
});

// products/6516dfc70d6c673d0b758fad/variations/651781177a96bb9cb682d936
export const updateSingleVariation = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  const variationId = req.params.variationId;

  const validate = new Validate(req.body)
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
    .isArrayEmpty('at least add one dimension');

  const updateFields: any = {};

  Object.keys(validate.data).forEach(key => {
    updateFields[`variations.$.${key}`] = validate.data[key];
  });

  const result = await db()
    .collection('products')
    .findOneAndUpdate(
      {
        _id: new ObjectId(productId),
        'variations._id': new ObjectId(variationId),
      },
      {
        $set: updateFields,
      }
    );
});

export const updateMultipleVariations = asyncHandler(
  async (req, res, next) => {}
);

// 1) create variations

// color : "red"
// size : "medium"

// regular price : 300
// discount : 10
// discount price
// sale price

// stock quantity : 30
// available : false
