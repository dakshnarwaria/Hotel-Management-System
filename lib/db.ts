import mysql, {
  type Pool,
  type PoolConnection,
  type QueryResult,
  type RowDataPacket,
} from "mysql2/promise";

const globalForMysql = globalThis as typeof globalThis & {
  hotelManagementPool?: Pool;
};

function getPool(): Pool {
  if (globalForMysql.hotelManagementPool) {
    return globalForMysql.hotelManagementPool;
  }

  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const missing = Object.entries({ DB_HOST, DB_USER, DB_NAME })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing database configuration: ${missing.join(", ")}`);
  }

  globalForMysql.hotelManagementPool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    decimalNumbers: true,
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return globalForMysql.hotelManagementPool;
}

export async function query<T extends QueryResult = RowDataPacket[]>(
  sql: string,
  params: (string | number | Date | null)[] = [],
): Promise<T> {
  const [rows] = await getPool().execute<T>(sql, params);
  return rows;
}

export async function withConnection<T>(
  callback: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}
