import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "jat_user",
  password: process.env.DB_PASSWORD || "jat_password",
  database: process.env.DB_NAME || "job_tracker",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testConnection = async (): Promise<void> => {
  let connection: mysql.PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log("MySQL connected successfully");
  } catch (error) {
    console.error("MySQL connection failed:", error);
    throw error;
  } finally {
    connection?.release();
  }
};
