import db from '../database/db.js';
import GlobalError from '../utils/globalError.js';
import { asyncHandler } from '../utils/methods.js';
import { responseStatus, statusCode } from '../utils/constants.js';
import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { UserTypes } from '../utils/constants.js';
import Validator from '../utils/validator.js';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import responseMessage from '../utils/responseMessage.js';

const sendCode = async (mobileNumber: string) => {
  const verificationCode = crypto.randomInt(123456, 987654);
  console.log(`${mobileNumber}, verification code = ${verificationCode}`);

  const expiresAt = new Date();

  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  return {
    verificationCode,
    expiresAt,
  };
};

const hashData = (data: any) => {
  return createHmac('sha256', process.env.HASH_SECRET!)
    .update(JSON.stringify(data))
    .digest('hex');
};

export const createAccount = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, mobileNumber, password } = new Validator(
    req.body
  )
    .field('firstName')
    .required('Please enter your first name.')
    .field('lastName')
    .required('Please enter your last name.')
    .field('mobileNumber')
    .required('Please enter your mobile number.')
    .check(/^[0-9]{10}$/, 'Please enter a valid mobile number.')
    .field('password')
    .required('Please enter the password.')
    .execute();

  const user = await db()
    .collection('users')
    .findOne({ mobileNumber }, { projection: { active: 1 } });

  if (user && user?.active) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        responseMessage.ACCOUNT_ALREADY_EXITS
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  if (user && !user?.active) {
    await db()
      .collection('users')
      .updateOne(
        { mobileNumber },
        {
          $set: {
            firstName,
            lastName,
            password: hashedPassword,
            passwordUpdatedAt: new Date(),
          },
        }
      );
  } else {
    await db().collection('users').insertOne({
      firstName,
      lastName,
      mobileNumber,
      password: hashedPassword,
      passwordUpdatedAt: new Date(),
      createdAt: new Date(),
      userType: UserTypes.CUSTOMER,
      mobileNumberVerified: false,
      active: false,
    });
  }

  const { expiresAt, verificationCode } = await sendCode(mobileNumber);

  const hash = hashData({ mobileNumber, verificationCode, expiresAt });

  res.status(statusCode.OK).json({
    status: 'success',
    data: { mobileNumber, expiresAt, hash },
    message: `A 6-digit verification code has been sent to ${mobileNumber}.`,
  });
});

export const verifyCode = asyncHandler(async (req, res, next) => {
  const { mobileNumber, verificationCode, expiresAt, hash } = new Validator(
    req.body
  )
    .field('mobileNumber')
    .required('mobile number is required.')
    .field('verificationCode')
    .required('Please enter your verification code.')
    .isNumber('verification code must be a number')
    .field('expiresAt')
    .required('expires at is required.')
    .isDate('expires at must be a date')
    .field('hash')
    .required('hash is required.')
    .execute();

  if (new Date() > new Date(expiresAt)) {
    return next(
      new GlobalError(statusCode.BAD_REQUEST, responseMessage.CODE_EXPIRES)
    );
  }

  const userHash = hashData({ mobileNumber, verificationCode, expiresAt });

  if (userHash !== hash) {
    return next(
      new GlobalError(statusCode.BAD_REQUEST, responseMessage.INCORRECT_CODE)
    );
  }
  next();
});

export const verifyMobile = asyncHandler(async (req, res, next) => {
  const { mobileNumber } = req.body;

  const result = await db()
    .collection('users')
    .findOneAndUpdate(
      { mobileNumber },
      {
        $set: {
          mobileNumberVerified: true,
          active: true,
        },
      },
      {
        returnDocument: 'after',
      }
    );

  if (!result.value) {
    return next(
      new GlobalError(statusCode.NOT_FOUND, responseMessage.ACCOUNT_NOT_FOUND)
    );
  }

  const authToken = jwt.sign(
    {
      userId: result.value?._id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '90d',
    }
  );

  res.status(statusCode.OK).json({
    status: responseStatus.SUCCESS,
    data: {
      authToken,
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { mobileNumber, password } = new Validator(req.body)
    .field('mobileNumber')
    .required('Please enter your mobile number.')
    .check(/^[0-9]{10}$/, 'Please enter a valid mobile number.')
    .field('password')
    .required('Please enter your password.')
    .execute();

  const user = await db().collection('users').findOne({
    mobileNumber,
    active: true,
  });

  if (!user) {
    return next(
      new GlobalError(statusCode.BAD_REQUEST, responseMessage.ACCOUNT_NOT_FOUND)
    );
  }

  const passwordMatched = await bcrypt.compare(password, user.password);

  if (!passwordMatched) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        responseMessage.INCORRECT_PASSWORD
      )
    );
  }

  const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: '90d',
  });

  res.status(statusCode.OK).json({
    status: responseStatus.SUCCESS,
    data: {
      authToken,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { mobileNumber } = new Validator(req.body)
    .field('mobileNumber')
    .required('Please enter the mobile number.')
    .check(/^[0-9]{10}$/, 'Please enter a valid mobile number.')
    .execute();

  const user = await db().collection('users').findOne({
    mobileNumber,
    active: true,
  });

  if (!user) {
    return next(
      new GlobalError(statusCode.BAD_REQUEST, responseMessage.ACCOUNT_NOT_FOUND)
    );
  }

  const { expiresAt, verificationCode } = await sendCode(mobileNumber);

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

export const passwordResetToken = asyncHandler(async (req, res, next) => {
  const { mobileNumber } = req.body;

  const user = await db().collection('users').findOne({
    mobileNumber,
    active: true,
  });

  if (!user) {
    return next(
      new GlobalError(
        statusCode.UNAUTHORIZED,
        responseMessage.ACCOUNT_NOT_FOUND
      )
    );
  }

  const passwordResetToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET!,
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

export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword } = new Validator(req.body)
    .field('currentPassword')
    .required('Please enter your current password.')
    .field('newPassword')
    .required('Please enter the new password')
    .execute();

  const passwordMatched = await bcrypt.compare(
    currentPassword,
    req.user.password
  );

  if (!passwordMatched) {
    return next(
      new GlobalError(
        statusCode.BAD_REQUEST,
        responseMessage.INCORRECT_PASSWORD
      )
    );
  }
  next();
});

export const verifyPasswordResetToken = asyncHandler(async (req, res, next) => {
  const { passwordResetToken } = new Validator(req.body)
    .field('passwordResetToken')
    .required('Password rest token is required')
    .isString('Password must be string')
    .field('newPassword')
    .required('Please enter the new password.')
    .execute();

  const data = jwt.verify(passwordResetToken, process.env.JWT_SECRET!);

  const { userId } = data as { userId: string };

  req.user = {
    _id: userId,
  };
  next();
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;
  const userId = req.user._id;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await db()
    .collection('users')
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword, passwordUpdatedAt: new Date() } }
    );

  if (user.matchedCount < 1) {
    return next(
      new GlobalError(statusCode.NOT_FOUND, responseMessage.ACCOUNT_NOT_FOUND)
    );
  }

  res.status(statusCode.OK).json({
    status: 'success',
    message: 'Your password has been successfully updated.',
  });
});

export const authorize = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer')) {
    return next(
      new GlobalError(statusCode.UNAUTHORIZED, responseMessage.UNAUTHORIZED)
    );
  }

  const authToken = authorization.split(' ').at(1);

  if (!authToken) {
    return next(
      new GlobalError(statusCode.UNAUTHORIZED, responseMessage.INVALID_TOKEN)
    );
  }

  const data = jwt.verify(authToken, process.env.JWT_SECRET!);

  const { userId } = data as { userId: string };

  const user = await db()
    .collection('users')
    .findOne({
      _id: new ObjectId(userId),
    });

  if (!user) {
    return next(
      new GlobalError(statusCode.NOT_FOUND, responseMessage.ACCOUNT_NOT_FOUND)
    );
  }

  if (user.password.passwordUpdatedAt > new Date()) {
  }

  req.user = user;
  next();
});

export const accessPermission = (...users: UserTypes[]) => {
  return asyncHandler(async (req, res, next) => {
    if (!users.includes(req.user.userType)) {
      return next(
        new GlobalError(statusCode.UNAUTHORIZED, responseMessage.CAN_NOT_ACCESS)
      );
    }
    next();
  });
};
