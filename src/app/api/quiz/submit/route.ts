import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { categoryId, schoolAccessId, answers, totalTimeLeft } = await req.json();

    if (!categoryId || !schoolAccessId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const checkRes = await pool.query(`
      SELECT qs.id 
      FROM quiz_submission qs 
      WHERE qs."categoryId" = $1 AND qs."schoolAccessId" = $2
    `, [categoryId, schoolAccessId]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    const catRes = await pool.query(`
      SELECT c."acceptingQuizAnswers" 
      FROM quiz_category qc
      JOIN competition c ON qc."competitionId" = c.id
      WHERE qc.id = $1
    `, [categoryId]);

    if (!catRes.rows[0]?.acceptingQuizAnswers) {
      return NextResponse.json({ error: "Quiz is closed" }, { status: 400 });
    }

    const questionsRes = await pool.query('SELECT id, "correctOption" FROM quiz_question WHERE "categoryId" = $1', [categoryId]);
    const questions = questionsRes.rows;

    let score = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctOption) {
        score++;
      }
    }

    const finalTimeLeft = parseInt(totalTimeLeft) || 0;

    await pool.query(
      'INSERT INTO quiz_submission ("categoryId", "schoolAccessId", score, answers, "totalTimeLeft") VALUES ($1, $2, $3, $4, $5)',
      [categoryId, schoolAccessId, score, JSON.stringify(answers), finalTimeLeft]
    );

    const cookieStore = await cookies();
    cookieStore.delete(`quiz_access_${categoryId}`);

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
