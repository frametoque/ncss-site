import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { QuizTaker } from "@/components/public/QuizTaker";
import { cookies } from "next/headers";

export default async function TakeQuizPage({ params }: { params: { slug: string, categoryId: string } }) {
  const { slug, categoryId } = await params;
  
  const cookieStore = await cookies();
  const accessCode = cookieStore.get(`quiz_access_${categoryId}`)?.value;

  if (!accessCode) redirect(`/competitions/${slug}/quiz/${categoryId}`);

  const accessRes = await pool.query(`
    SELECT sa.* 
    FROM school_access sa 
    JOIN quiz_category qc ON sa."competitionId" = qc."competitionId"
    WHERE qc.id = $1 AND sa."accessCode" = $2
  `, [categoryId, accessCode]);
  
  if (accessRes.rows.length === 0) redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
  const schoolAccess = accessRes.rows[0];

  const subRes = await pool.query('SELECT id FROM quiz_submission WHERE "categoryId" = $1 AND "schoolAccessId" = $2', [categoryId, schoolAccess.id]);
  if (subRes.rows.length > 0) redirect(`/competitions/${slug}/quiz/${categoryId}?error=AlreadySubmitted`);

  const categoryRes = await pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]);
  const category = categoryRes.rows[0];

  const questionsRes = await pool.query('SELECT id, "questionText", image, options FROM quiz_question WHERE "categoryId" = $1', [categoryId]);
  const questions = questionsRes.rows;

  const compRes = await pool.query('SELECT title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug]);
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
