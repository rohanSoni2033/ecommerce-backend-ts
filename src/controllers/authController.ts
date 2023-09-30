import db from '../database/db.js';
import GlobalError from '../utils/globalError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { responseStatus, statusCode } from '../utils/constants.js';
import { createHmac, randomInt } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { UserTypes } from '../utils/constants.js';
import Validate from '../utils/validate.js';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const sendVerificationCode = async (mobileNumber: string) => {
  const verificationCode = crypto.randomInt(123456, 987654);
  console.log(`${mobileNumber}, verification code = ${verificationCode}`);

  const expiresAt = new Date();

  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  return {
    verificationCode,
    expiresAt,
  };
};

const hashData = (data: {}) => {
  return createHmac('sha256', process.env.hashSecret!)
    .update(JSON.stringify(data))
    .digest('hex');
};

const validateCreateAccount = (body: {}) => {
  const validate = new Validate(body)
    .field('name')
    .required('Please provide the name')
    .isString('Name must be a string')
    .validate(value => value.length <= 24, 'name be maximum of 24 characters')
    .field('mobileNumber')
    .required('Please provide the mobile number')
    .check(/^[0-9]{10}$/, 'Please provide a valid mobile number')
    .field('password')
    .required('Please provide the password')
    .validate(
      value => value.length >= 8,
      'Password must be of at least 8 characters'
    )
    .field('email')
    .isString('Email must be a string');

  return validate.errors;
};

export const createAccount = asyncHandler(async (req, res, next) => {
  const { name, mobileNumber, password } = req.body;

  const errors = validateCreateAccount(req.body);

  if (errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, errors));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { insertedId } = await db().collection('users').insertOne({
    name,
    mobileNumber,
    password: hashedPassword,
    passwordUpdatedAt: new Date(),
    createdAt: new Date(),
    userType: UserTypes.CUSTOMER,
    mobileNumberVerified: false,
  });

  const { expiresAt, verificationCode } = await sendVerificationCode(
    mobileNumber
  );

  const hash = hashData({
    mobileNumber,
    verificationCode,
    expiresAt,
  });

  res.status(statusCode.OK).json({
    status: 'success',
    data: { mobileNumber, expiresAt, hash },
  });
});

export const verifyMobile = asyncHandler(async (req, res, next) => {
  const {
    mobileNumber,
    expiresAt,
    verificationCode,
    hash: userHash,
  } = req.body;

  const validate = new Validate(req.body)
    .field('mobileNumber')
    .required('Please provide the mobile number')
    .field('expiresAt')
    .required('Please provide the expires at')
    .isDate('Please provide a valid expires at')
    .field('verificationCode')
    .required('Please provide the verification code')
    .isNumber('Please provide a valid verification code')
    .field('hash')
    .required('Please provide the hash');

  if (validate.errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, validate.errors));
  }

  const hash = hashData({
    mobileNumber,
    verificationCode,
    expiresAt,
  });

  if (userHash !== hash) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        'wrong verification code, try again'
      )
    );
  }

  if (new Date() > new Date(expiresAt)) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        'verification code expires, try again'
      )
    );
  }

  const result = await db()
    .collection('users')
    .findOneAndUpdate(
      {
        mobileNumber,
      },
      {
        $set: {
          mobileNumberVerified: true,
        },
      }
    );

  if (!result.value) {
    return next(
      new GlobalError(
        statusCode.UNAUTHORIZED,
        'User not found with this mobile number'
      )
    );
  }

  const token = jwt.sign(
    {
      userId: result.value?._id,
    },
    process.env.jwtSecret!,
    {
      expiresIn: '90d',
    }
  );

  res.status(statusCode.OK).json({
    status: responseStatus.SUCCESS,
    data: {
      token,
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { mobileNumber, password } = req.body;

  const validate = new Validate(req.body)
    .field('mobileNumber')
    .required('Please provide the mobile number')
    .check(/^[0-9]{10}$/, 'Please provide a valid mobile number')
    .field('password')
    .required('Please provide the password');

  if (validate.errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, validate.errors));
  }

  const user = await db().collection('users').findOne({
    mobileNumber,
  });

  if (!user) {
    return next(new GlobalError(statusCode.BAD_REQUEST, 'User not found'));
  }

  const passwordMatched = await bcrypt.compare(password, user.password);

  if (!passwordMatched) {
    return next(new GlobalError(statusCode.BAD_REQUEST, 'Password is wrong'));
  }

  if (user.verified) {
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.jwtSecret!,
      {
        expiresIn: '90d',
      }
    );

    res.status(statusCode.OK).json({
      status: responseStatus.SUCCESS,
      data: {
        token,
      },
    });
  } else {
    const { expiresAt, verificationCode } = await sendVerificationCode(
      mobileNumber
    );

    const hash = hashData({
      mobileNumber,
      verificationCode,
      expiresAt,
    });

    res.status(statusCode.OK).json({
      status: 'success',
      data: { mobileNumber, expiresAt, hash },
    });
  }
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { mobileNumber } = req.body;

  const validate = new Validate(req.body)
    .field('mobileNumber')
    .required('Please provide the mobile number')
    .check(/^[0-9]{10}$/, 'Please provide a valid mobile number');

  if (validate.errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, validate.errors));
  }

  const user = db().collection('users').findOne({
    mobileNumber,
  });

  if (!user) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        'User not found with this mobile number'
      )
    );
  }

  const { expiresAt, verificationCode } = await sendVerificationCode(
    mobileNumber
  );

  const hash = hashData({
    mobileNumber,
    verificationCode,
    expiresAt,
  });

  res.status(statusCode.OK).json({
    status: 'success',
    data: { verificationCode, mobileNumber, expiresAt, hash },
  });
});

export const passwordResetToken = asyncHandler(async (req, res, next) => {
  const {
    mobileNumber,
    expiresAt,
    verificationCode,
    hash: userHash,
  } = req.body;

  const validate = new Validate(req.body)
    .field('mobileNumber')
    .required('Please provide the mobile number')
    .field('expiresAt')
    .required('Please provide the expires at')
    .isDate('Please provide a valid expires at')
    .field('verificationCode')
    .required('Please provide the verification code')
    .isNumber('Please provide a valid verification code')
    .field('hash')
    .required('Please provide the hash');

  if (validate.errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, validate.errors));
  }

  const hash = hashData({
    mobileNumber,
    verificationCode,
    expiresAt,
  });

  if (userHash !== hash) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        'wrong verification code, try again'
      )
    );
  }

  if (new Date() > new Date(expiresAt)) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        'verification code expires, try again'
      )
    );
  }

  const user = await db().collection('users').findOne({
    mobileNumber,
  });

  if (!user) {
    return next(
      new GlobalError(
        statusCode.UNAUTHORIZED,
        'User not found with this mobile number'
      )
    );
  }

  const passwordResetToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.jwtSecret!,
    {
      expiresIn: '3min',
    }
  );

  res.status(statusCode.OK).json({
    status: responseStatus.SUCCESS,
    data: {
      passwordResetToken,
    },
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { passwordResetToken, newPassword } = req.body;

  const validate = new Validate(req.body)
    .field('passwordResetToken')
    .required('Password rest token is required')
    .isString('password must be string')
    .field('newPassword')
    .required('new password is required');

  if (validate.errors.length > 0) {
    return next(new GlobalError(statusCode.BAD_REQUEST, validate.errors));
  }

  const data = jwt.verify(passwordResetToken, process.env.jwtSecret!) as {
    userId: string;
  };

  const userId = data.userId;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await db()
    .collection('users')
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );

  if (user.matchedCount < 1) {
    return next(new GlobalError(statusCode.NOT_FOUND, 'User not found'));
  }

  res.status(statusCode.BAD_REQUEST).json({
    status: 'success',
  });
});

export const authorize = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer')) {
    return next(
      new GlobalError(
        statusCode.UNAUTHORIZED,
        'please login to access this route'
      )
    );
  }

  const token = authorization.split(' ').at(1);
  if (!token) {
    return next(new GlobalError(statusCode.UNAUTHORIZED, 'invalid token'));
  }

  const decoded = jwt.verify(token, process.env.jwtSecret!) as {
    userId: string;
  };

  const usersCollection = db().collection('users');

  const user = await usersCollection.findOne({
    _id: new ObjectId(decoded.userId),
  });

  if (!user) {
    return next(new GlobalError(statusCode.NOT_FOUND, 'user not found'));
  }

  req.user = user;
  next();
});

export const accessPermission = (...users: UserTypes[]) => {
  return asyncHandler(async (req, res, next) => {
    if (!users.includes(req.user.userType)) {
      return next(
        new GlobalError(
          statusCode.UNAUTHORIZED,
          'you cannot access this permission'
        )
      );
    }
    next();
  });
};
