import { Router } from 'express';
import { getFeatureUsageStats } from '../controllers/featureUsageController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// Menjadi GET /api/feature-usage karena sudah di-mount di app.use('/api/feature-usage', featureUsageRoutes)
router.get('/', getFeatureUsageStats);

export default router;