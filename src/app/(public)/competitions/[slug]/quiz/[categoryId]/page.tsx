import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";

export default async function QuizAccessPage({ params, searchParams }: { params: Promise<{ slug: string, categoryId: string }>, searchParams: Promise<{ error?: string }> }) {
  const { slug, categoryId } = await params;
  const { error } = await searchParams;

  const res = await pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]);
  if (res.rows.length === 0) notFound();
  const category = res.rows[0];

  const compRes = await pool.query('SELECT title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug]);
  const competition = compRes.rows[0];
  const competitionTitle = competition?.title || 'Competition';

  if (!competition?.acceptingQuizAnswers) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold font-heading text-gray-900 mb-2">{competitionTitle}</h1>
          <p className="text-gray-600">This quiz is currently closed and not accepting answers.</p>
        </div>
      </div>
    );
  }

  async function checkAccess(formData: FormData) {
    "use server";
    const accessCode = formData.get("accessCode") as string;
    
    const accessRes = await pool.query(`
      SELECT sa.* 
      FROM school_access sa 
      JOIN quiz_category qc ON sa."competitionId" = qc."competitionId"
      WHERE qc.id = $1 AND sa."accessCode" = $2
    `, [categoryId, accessCode]);
    
    if (accessRes.rows.length === 0) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    const schoolAccess = accessRes.rows[0];

    const subRes = await pool.query('SELECT id FROM quiz_submission WHERE "categoryId" = $1 AND "schoolAccessId" = $2', [categoryId, schoolAccess.id]);
    if (subRes.rows.length > 0) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=AlreadySubmitted`);
    }

    const cookieStore = await cookies();
    cookieStore.set(`quiz_access_${categoryId}`, accessCode, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2 // 2 hours
    });

    redirect(`/competitions/${slug}/quiz/${categoryId}/take`);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">{competitionTitle}</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{category.name} Quiz</h2>
          <p className="text-gray-600">Enter your school's access code to begin.</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-900 space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-orange-800">
            Important Rules & Anti-Cheat
          </h3>
          <ul className="list-disc list-inside space-y-1 ml-1 text-orange-800/90 leading-relaxed">
            <li>You <strong>cannot go backwards</strong>. Once you proceed, you cannot return to previous questions.</li>
            <li>If a question timer runs out, you will automatically be moved to the next question.</li>
            <li><strong>Do not leave the tab.</strong> If you switch tabs, you have 10 seconds to return or the question will be skipped automatically.</li>
            <li>Copying text, right-clicking, and keyboard shortcuts are strictly disabled.</li>
          </ul>
        </div>

        {error === 'InvalidAccessCode' && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            Invalid access code. Please try again.
          </div>
        )}
        
        {error === 'AlreadySubmitted' && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            Your school has already submitted answers for this quiz.
          </div>
        )}

        <form action={checkAccess} className="space-y-6">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
            <input 
              type="text" 
              id="accessCode" 
              name="accessCode" 
              required 
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-maroon-500 focus:border-maroon-500"
              placeholder="e.g. A1B2C3"
            />
          </div>
          
          <Button size="lg" type="submit" className="w-full rounded-xl h-12 text-lg shadow-lg shadow-maroon-500/30">
            Enter Quiz
          </Button>
        </form>
      </div>
    </div>
  );
}
