import { Router } from 'express';
import { register, login, logout, lupasandi } from '../controllers/authController';
import { requireGuest, verifyToken } from '../middlewares/authMiddleware';
import { validateRegisterManual } from '../middlewares/validationMiddlewares';


const router: Router = Router();


router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/lupa-sandi', lupasandi);


// 🔒 Rute yang Dilindungi (Wajib pakai verifyToken karena khusus user yang sudah login)
router.get('/profile', verifyToken, (req, res) => {
  // Logika ambil profil
});


export default router;
