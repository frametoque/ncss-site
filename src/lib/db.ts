import { Pool, neonConfig } from '@neondatabase/serverless';

// Route standard queries via HTTP fetch for serverless resilience (avoids WebSocket drops and cold start ErrorEvents)
neonConfig.poolQueryViaFetch = true;

declare global {
  var _neonPool: Pool | undefined;
}

if (!global._neonPool) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const p = new Pool({
    connectionString,
  });
  p.on('error', (err: unknown) => {
    console.error('Neon Pool background error:', err);
  });
  global._neonPool = p;
}
const pool: Pool = global._neonPool;

export default pool;
