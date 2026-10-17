import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";

  try {
    const res = await pool.query("SELECT 1 AS health");
    if (res.rows[0]?.health === 1) {
      dbStatus = "connected";
    }
  } catch (err: unknown) {
    dbStatus = "error";
    console.error("Healthcheck DB query failed:", err);
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: dbStatus,
        latencyMs: Date.now() - startTime,
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      latencyMs: Date.now() - startTime,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
