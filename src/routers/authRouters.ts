import { Router } from 'express';
import {
  createAccount,
  login,
  verifyMobile,
  forgotPassword,
  resetPassword,
  passwordResetToken,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/create-account', createAccount);
router.post('/verify-mobile', verifyMobile);
router.post('/forgot-password', forgotPassword);
router.post('/password-reset-token', passwordResetToken);
router.patch('/reset-password', resetPassword);

export default router;
