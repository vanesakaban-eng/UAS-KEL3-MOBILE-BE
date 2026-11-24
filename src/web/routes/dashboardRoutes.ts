import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';


const router = Router();


router.use(verifyToken);


// Endpoint final: GET /api/dashboard
router.get('/', (req: Request, res: Response) => {
  try {
    const dashboardData = {
      stats: {
        totalPengguna: 0,
        penggunaAktif: 0,
        penggunaBaru: 0,
        totalAktivitas: 0
      },
      features: [],
      recentUsers: []
    };


    res.status(200).json(dashboardData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


export default router;
