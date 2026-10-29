# Backend Mobile UKu

Backend Express + TypeScript ini berjalan terpisah dari backend website dan memakai tabel `users` pada database `db_uku` yang sama. Konfigurasi database dibaca dari `../src/.env` backend website; variabel environment yang sudah disetel pada sistem akan tetap dipakai.

Tabel `mobile_budgets`, `mobile_savings`, dan `mobile_transactions` dibuat otomatis saat server dimulai. Data finansial dipisahkan per `user_id`.

```bash
npm install
npm run dev
```

Server berjalan di port `5001` secara default. Gunakan variabel `MOBILE_PORT` untuk mengganti port, agar tidak memakai `PORT` milik backend website. Jalankan MySQL dan pastikan database `db_uku` tersedia terlebih dahulu.

Endpoint:

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/profile`, `PUT /api/profile`
- `GET /api/dashboard?month=YYYY-MM`
- `GET /api/budget?month=YYYY-MM`, `PUT /api/budget`
- `GET /api/transactions`, `POST /api/transactions`
- `GET /api/savings`, `POST /api/savings`, `POST /api/savings/:id/deposits`

Selain autentikasi dan health-check, endpoint memerlukan header `Authorization: Bearer <token>`.

Reset password mengirim OTP enam digit melalui email. Atur `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, dan `SMTP_FROM` di `backend/src/.env`; `SMTP_SECURE=true` dapat dipakai untuk koneksi TLS pada port 465. OTP berlaku 10 menit dan maksimal lima kali percobaan.