import { Pool } from '@neondatabase/serverless';

declare global {
  var _neonPool: Pool | undefined;
}

let pool: Pool;

if (!global._neonPool) {
  global._neonPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}
pool = global._neonPool;

export default pool;
