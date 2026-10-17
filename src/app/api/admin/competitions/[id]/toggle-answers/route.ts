import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const toggleAnswersSchema = z.object({
  acceptingQuizAnswers: z.boolean(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid competition ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = toggleAnswersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    await pool.query(
      'UPDATE "competition" SET "acceptingQuizAnswers" = $1 WHERE id = $2',
      [parsed.data.acceptingQuizAnswers, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle answers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
