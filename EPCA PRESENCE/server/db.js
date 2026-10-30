import { config } from "dotenv";
import { createPool } from "mysql2/promise";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

export const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "ma-promotion",
};

export const apiPort = Number(process.env.API_PORT || 8787);

export const pool = createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  multipleStatements: false,
});

export async function pingDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1");
    const [tables] = await conn.query(
      "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = 'promotions'",
      [dbConfig.database],
    );
    return { ok: true, hasSchema: Number(tables[0]?.n) > 0 };
  } finally {
    conn.release();
  }
}
