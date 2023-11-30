import { Router } from 'express';
import {
  createAccount,
  login,
  verifyCode,
  verifyMobile,
  forgotPassword,
  resetPassword,
  passwordResetToken,
  authorize,
  changePassword,
  verifyPasswordResetToken,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/create-account', createAccount);
router.post('/verify-mobile', verifyCode, verifyMobile);

router.post('/forgot-password', forgotPassword);
router.post('/password-reset-token', verifyCode, passwordResetToken);
router.post('/reset-password', verifyPasswordResetToken, resetPassword);
router.post('/change-password', authorize, changePassword, resetPassword);

export default router;
