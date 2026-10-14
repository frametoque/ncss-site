import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { QuizTaker } from "@/components/public/QuizTaker";
import { cookies } from "next/headers";

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
  
  // 2. If no direct match on category, check across other categories
  if (accessRes.rows.length === 0) {
    const crossRes = await pool.query(`
      SELECT sa.*, c.slug as "compSlug"
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

  const schoolAccess = accessRes.rows[0];

  const [subRes, categoryRes, questionsRes, compRes] = await Promise.all([
    pool.query('SELECT id FROM quiz_submission WHERE "categoryId" = $1 AND "schoolAccessId" = $2', [categoryId, schoolAccess.id]),
    pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]),
    pool.query('SELECT id, "questionText", image, options FROM quiz_question WHERE "categoryId" = $1', [categoryId]),
    pool.query('SELECT title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug])
  ]);

  if (subRes.rows.length > 0) redirect(`/competitions/${slug}/quiz/${categoryId}?error=AlreadySubmitted`);
  const category = categoryRes.rows[0];
  const questions = questionsRes.rows;
  const competition = compRes.rows[0];
  const competitionTitle = competition?.title || 'Competition';

  if (!competition?.acceptingQuizAnswers) {
    redirect(`/competitions/${slug}/quiz/${categoryId}`);
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-100px)] md:h-[calc(100vh-100px)]">
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
