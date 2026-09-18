import { Pool } from '@neondatabase/serverless';

declare global {
  var _neonPool: Pool | undefined;
}

if (!global._neonPool) {
  global._neonPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}
const pool: Pool = global._neonPool;

export default pool;
