import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { getSubjectName } from "@/lib/quizSubjects";
import { quizSubmitRateLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

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

const quizSubmitSchema = z.object({
  categoryId: z.string().min(1),
  schoolAccessId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
  totalTimeLeft: z.union([z.number(), z.string()]).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limiting per client IP
    const ip = await getClientIp(req);
    const rateCheck = quizSubmitRateLimiter.check(ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many submission attempts. Please slow down." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission data" }, { status: 400 });
    }

    const { categoryId, schoolAccessId, answers, totalTimeLeft } = parsed.data;

    // 2. Cookie access code verification
    const cookieStore = await cookies();
    const cookieCode = cookieStore.get(`quiz_access_${categoryId}`)?.value?.trim().toUpperCase().replace(/[\s-]+/g, "");
    
    if (!cookieCode) {
      return NextResponse.json({ error: "Access session expired or unauthorized. Please re-enter your school access code." }, { status: 401 });
    }

    // Verify school_access record belongs to this category and has matching access code
    const accessRes = await pool.query(
      `SELECT sa.id, sa."accessCode", sa."schoolName", sa."competitionId", qc.name as "categoryName"
       FROM school_access sa
       JOIN quiz_category qc ON sa."categoryId" = qc.id
       WHERE sa.id = $1 AND sa."categoryId" = $2`,
      [schoolAccessId, categoryId]
    );

    if (accessRes.rows.length === 0) {
      return NextResponse.json({ error: "Invalid school access identifier" }, { status: 401 });
    }

    const schoolAccess = accessRes.rows[0];
    const cleanDbCode = (schoolAccess.accessCode || "").trim().toUpperCase().replace(/[\s-]+/g, "");
    if (cleanDbCode !== cookieCode) {
      return NextResponse.json({ error: "Unauthorized access code mismatch" }, { status: 401 });
    }

    // 3. Concurrently check existing submission, competition status, and fetch questions
    const [checkRes, compRes, questions] = await Promise.all([
      pool.query(`
        SELECT qs.id, qc.name as "categoryName"
        FROM quiz_submission qs
        JOIN school_access sa ON qs."schoolAccessId" = sa.id
        JOIN quiz_category qc ON qs."categoryId" = qc.id
        WHERE LOWER(TRIM(sa."schoolName")) = LOWER(TRIM($1))
          AND sa."competitionId" = $2
      `, [schoolAccess.schoolName, schoolAccess.competitionId]),
      pool.query(`
        SELECT c."acceptingQuizAnswers"
        FROM competition c
        WHERE c.id = $1
      `, [schoolAccess.competitionId]),
      getCachedQuestions(categoryId)
    ]);

    const targetCategoryName = schoolAccess.categoryName;
    const targetSubject = targetCategoryName ? getSubjectName(targetCategoryName).toLowerCase() : "";
    const alreadySubmitted = checkRes.rows.some(
      r => getSubjectName(r.categoryName || "").toLowerCase() === targetSubject
    );

    if (alreadySubmitted) {
      return NextResponse.json({ error: "Quiz answers have already been submitted for this subject by your school." }, { status: 400 });
    }

    if (!compRes.rows[0]?.acceptingQuizAnswers) {
      return NextResponse.json({ error: "This quiz is currently closed and not accepting answers." }, { status: 400 });
    }

    // 4. Calculate score securely on server
    let score = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctOption) {
        score++;
      }
    }

    const finalTimeLeft = typeof totalTimeLeft === "number" ? Math.max(0, Math.floor(totalTimeLeft)) : (parseInt(String(totalTimeLeft || "0"), 10) || 0);

    await pool.query(
      'INSERT INTO quiz_submission ("categoryId", "schoolAccessId", score, answers, "totalTimeLeft") VALUES ($1, $2, $3, $4, $5)',
      [categoryId, schoolAccessId, score, JSON.stringify(answers), finalTimeLeft]
    );

    // Invalidate access cookie
    cookieStore.delete(`quiz_access_${categoryId}`);

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
