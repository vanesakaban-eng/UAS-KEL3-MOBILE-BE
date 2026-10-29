"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const schema_1 = require("./config/schema");
const port = Number(process.env.MOBILE_PORT) || 5001;
void (0, schema_1.initializeSchema)()
    .catch(() => {
    console.error('Schema mobile belum dapat disiapkan; pastikan MySQL dan db_uku tersedia.');
})
    .finally(() => {
    app_1.default.listen(port, () => {
        console.log(`UKu mobile API berjalan pada port ${port}`);
    });
});
