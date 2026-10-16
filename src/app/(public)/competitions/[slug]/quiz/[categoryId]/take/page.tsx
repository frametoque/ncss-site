import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { QuizTaker } from "@/components/public/QuizTaker";
import { cookies } from "next/headers";
import { getSubjectName } from "@/lib/quizSubjects";

export default async function TakeQuizPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string, categoryId: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { slug, categoryId } = await params;
  const { code: queryCode } = await searchParams;
  
  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(`quiz_access_${categoryId}`)?.value;
  const rawCode = queryCode || cookieCode || "";
  const accessCode = rawCode.trim().toUpperCase().replace(/[\s-]+/g, "");

  if (!accessCode) redirect(`/competitions/${slug}/quiz/${categoryId}`);

  // 1. Try exact match on current category
  let accessRes = await pool.query(`
    SELECT sa.* 
    FROM school_access sa 
    WHERE (
      sa."categoryId" = $1 
      OR (sa."categoryId" IS NULL AND sa."competitionId" = (SELECT "competitionId" FROM quiz_category WHERE id = $1))
    )
    AND UPPER(REPLACE(sa."accessCode", ' ', '')) = $2
  `, [categoryId, accessCode]);
  
  let schoolAccess = accessRes.rows[0];

  // 2. If no direct match on category, check if this code belongs to the same subject in this competition
  if (!schoolAccess) {
    const sameSubjectRes = await pool.query(`
      SELECT sa.*, qc.name as "categoryName"
      FROM school_access sa
      JOIN quiz_category qc ON sa."categoryId" = qc.id
      WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
        AND sa."competitionId" = (SELECT "competitionId" FROM quiz_category WHERE id = $2)
    `, [accessCode, categoryId]);

    const catRes = await pool.query('SELECT name FROM quiz_category WHERE id = $1', [categoryId]);
    const currentSubjectLower = getSubjectName(catRes.rows[0]?.name || "").toLowerCase();

    const match = sameSubjectRes.rows.find(
      r => getSubjectName(r.categoryName || "").toLowerCase() === currentSubjectLower
    );

    if (match) {
      // Find or insert specific category entry so schoolAccessId is valid
      const specificRes = await pool.query(
        'SELECT id FROM school_access WHERE "competitionId" = $1 AND "categoryId" = $2 AND LOWER(TRIM("schoolName")) = LOWER(TRIM($3))',
        [match.competitionId, categoryId, match.schoolName]
      );
      if (specificRes.rows.length === 0) {
        const insRes = await pool.query(
          'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4) RETURNING *',
          [match.competitionId, categoryId, match.schoolName, accessCode]
        );
        schoolAccess = insRes.rows[0];
      } else {
        match.id = specificRes.rows[0].id;
        match.categoryId = categoryId;
        schoolAccess = match;
      }
    }
  }

  // 3. If still not matched, check across other subjects/competitions
  if (!schoolAccess) {
    const crossRes = await pool.query(`
      SELECT sa.*, c.slug as "compSlug", qc.name as "categoryName"
      FROM school_access sa
      LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id
      LEFT JOIN competition c ON (qc."competitionId" = c.id OR sa."competitionId" = c.id)
      WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
      LIMIT 1
    `, [accessCode]);

    if (crossRes.rows.length > 0 && crossRes.rows[0].categoryId && crossRes.rows[0].categoryId !== categoryId) {
      const correctTarget = crossRes.rows[0];
      const targetSlug = correctTarget.compSlug || slug;

      redirect(`/competitions/${targetSlug}/quiz/${correctTarget.categoryId}/take?code=${encodeURIComponent(accessCode)}`);
    }

    redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
  }

  const [subRes, categoryRes, questionsRes, compRes] = await Promise.all([
    pool.query(`
      SELECT qs.id, qc.name as "categoryName" 
      FROM quiz_submission qs 
      JOIN school_access sa ON qs."schoolAccessId" = sa.id 
      JOIN quiz_category qc ON qs."categoryId" = qc.id
      WHERE LOWER(TRIM(sa."schoolName")) = LOWER(TRIM($1))
        AND sa."competitionId" = (SELECT "competitionId" FROM quiz_category WHERE id = $2)
    `, [schoolAccess.schoolName, categoryId]),
    pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]),
    pool.query('SELECT id, "questionText", image, options, code, "codeLanguage" FROM quiz_question WHERE "categoryId" = $1 ORDER BY "orderIndex" ASC NULLS LAST, id ASC', [categoryId]),
    pool.query('SELECT title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug])
  ]);

  const category = categoryRes.rows[0];
  const currentSubLower = getSubjectName(category.name).toLowerCase();
  const alreadyDone = subRes.rows.some(
    r => getSubjectName(r.categoryName || "").toLowerCase() === currentSubLower
  );

  if (alreadyDone) redirect(`/competitions/${slug}/quiz/${categoryId}?error=AlreadySubmitted`);
  const questions = questionsRes.rows;
  const competition = compRes.rows[0];
  const competitionTitle = competition?.title || 'Competition';

  if (!competition?.acceptingQuizAnswers) {
    redirect(`/competitions/${slug}/quiz/${categoryId}`);
  }

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col justify-center min-h-[calc(100dvh-4.5rem)]">
      <QuizTaker 
        category={category} 
        competitionTitle={competitionTitle}
        questions={questions} 
        schoolAccessId={schoolAccess.id} 
        schoolName={schoolAccess.schoolName}
        slug={slug}
      />
    </div>
  );
}
