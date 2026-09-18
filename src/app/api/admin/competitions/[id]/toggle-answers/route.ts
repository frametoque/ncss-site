import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { acceptingQuizAnswers } = await req.json();

    await pool.query(
      'UPDATE "competition" SET "acceptingQuizAnswers" = $1 WHERE id = $2',
      [acceptingQuizAnswers, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle answers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
