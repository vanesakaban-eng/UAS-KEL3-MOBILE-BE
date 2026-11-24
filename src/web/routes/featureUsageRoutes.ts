import { Router } from 'express';
import { getFeatureUsageStats } from '../controllers/featureUsageController';
import { verifyToken } from '../middlewares/authMiddleware';


const router = Router();


router.use(verifyToken);


// Endpoint yang akan diakses oleh frontend Next.js
router.get('/feature-usage', getFeatureUsageStats);


export default router;
