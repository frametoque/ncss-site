import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

import { getSubjectName } from "@/lib/quizSubjects";

// In-memory cache for questions during submission rush (60s TTL)
interface CachedQuestions {
  data: Array<{ id: string; correctOption: string }>;
  expires: number;
}
const questionCache = new Map<string, CachedQuestions>();

async function getCachedQuestions(categoryId: string) {
  const now = Date.now();
  const cached = questionCache.get(categoryId);
  if (cached && cached.expires > now) {
    return cached.data;
  }
  const questionsRes = await pool.query('SELECT id, "correctOption" FROM quiz_question WHERE "categoryId" = $1', [categoryId]);
  questionCache.set(categoryId, { data: questionsRes.rows, expires: now + 60_000 });
  return questionsRes.rows;
}

export async function POST(req: Request) {
  try {
    const { categoryId, schoolAccessId, answers, totalTimeLeft } = await req.json();

    if (!categoryId || !schoolAccessId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [checkRes, catRes, questions] = await Promise.all([
      pool.query(`
        SELECT qs.id, qc.name as "categoryName"
        FROM quiz_submission qs
        JOIN school_access sa ON qs."schoolAccessId" = sa.id
        JOIN quiz_category qc ON qs."categoryId" = qc.id
        WHERE LOWER(TRIM(sa."schoolName")) = (SELECT LOWER(TRIM(sa2."schoolName")) FROM school_access sa2 WHERE sa2.id = $2)
          AND sa."competitionId" = (SELECT "competitionId" FROM quiz_category WHERE id = $1)
      `, [categoryId, schoolAccessId]),
      pool.query(`
        SELECT c."acceptingQuizAnswers", qc.name
        FROM quiz_category qc
        JOIN competition c ON qc."competitionId" = c.id
        WHERE qc.id = $1
      `, [categoryId]),
      getCachedQuestions(categoryId)
    ]);

    const targetCategoryName = catRes.rows[0]?.name;
    const targetSubject = targetCategoryName ? getSubjectName(targetCategoryName).toLowerCase() : "";
    const alreadySubmitted = checkRes.rows.some(
      r => getSubjectName(r.categoryName || "").toLowerCase() === targetSubject
    );

    if (alreadySubmitted) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    if (!catRes.rows[0]?.acceptingQuizAnswers) {
      return NextResponse.json({ error: "Quiz is closed" }, { status: 400 });
    }

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
