import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';


const router = Router();


router.use(verifyToken);


router.get('/users', (req: Request, res: Response) => {
  try {
    const usersData = {
      success: true,
      stats: {
        totalTerdaftar: 0,
        penggunaAktif: 0,
        penggunaNonaktif: 0,
        pendaftarBulanIni: 0
      },
      data: []
    };


    res.status(200).json(usersData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


export default router;
