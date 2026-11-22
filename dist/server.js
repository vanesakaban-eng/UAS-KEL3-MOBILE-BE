"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: process.env.ENV_FILE || node_path_1.default.resolve(__dirname, '../.env'),
});
const app_1 = __importDefault(require("./app"));
const schema_1 = require("./config/schema");
const port = Number(process.env.PORT) || Number(process.env.MOBILE_PORT) || 5001;
void (0, schema_1.initializeSchema)()
    .then(() => {
    console.log('[Database] 5 Kategori Tabel berhasil diinisialisasi dan disiapkan.');
})
    .catch((err) => {
    console.error('[Database Warning] Skema database belum dapat disiapkan; pastikan MySQL aktif dan database db_uku tersedia.', err.message);
})
    .finally(() => {
    app_1.default.listen(port, () => {
        console.log(`====================================================`);
        console.log(`🚀 UKu Single Backend API berjalan di http://localhost:${port}`);
        console.log(`📡 Melayani: Mobile Flutter & Website NextJS`);
        console.log(`🤖 AI Service: Active (Gemini API with Fallback Engine)`);
        console.log(`====================================================`);
    });
});
