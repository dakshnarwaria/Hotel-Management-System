import mysql, {
  type Pool,
  type PoolConnection,
  type QueryResult,
  type RowDataPacket,
} from "mysql2/promise";

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;

  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const missing = Object.entries({ DB_HOST, DB_USER, DB_NAME })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing database configuration: ${missing.join(", ")}`);
  }

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    decimalNumbers: true,
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
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
