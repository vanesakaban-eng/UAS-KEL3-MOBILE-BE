import { RequestHandler, Response, Router } from 'express';
import {
  addSavingDeposit,
  createSaving,
  createTransaction,
  getBudget,
  getDashboard,
  getProfile,
  listSavings,
  listTransactions,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  saveBudget,
  updateProfile,
} from '../controllers/mobileController';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';

const router = Router();
const authenticated = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>,
): RequestHandler => (req, res, next) => {
  void handler(req as AuthenticatedRequest, res).catch(next);
};

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', requestPasswordReset);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/logout', (_req, res) => res.json({ message: 'Logout berhasil.' }));
router.get('/profile', requireAuth, authenticated(getProfile));
router.put('/profile', requireAuth, authenticated(updateProfile));
router.get('/dashboard', requireAuth, authenticated(getDashboard));
router.get('/budget', requireAuth, authenticated(getBudget));
router.put('/budget', requireAuth, authenticated(saveBudget));
router.get('/transactions', requireAuth, authenticated(listTransactions));
router.post('/transactions', requireAuth, authenticated(createTransaction));
router.get('/savings', requireAuth, authenticated(listSavings));
router.post('/savings', requireAuth, authenticated(createSaving));
router.post('/savings/:id/deposits', requireAuth, authenticated(addSavingDeposit));

export default router;