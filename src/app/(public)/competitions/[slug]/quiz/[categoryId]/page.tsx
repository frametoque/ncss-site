import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";

export default async function QuizAccessPage({ params, searchParams }: { params: Promise<{ slug: string, categoryId: string }>, searchParams: Promise<{ error?: string }> }) {
  const { slug, categoryId } = await params;
  const { error } = await searchParams;

  const [res, compRes] = await Promise.all([
    pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]),
    pool.query('SELECT title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug])
  ]);
  if (res.rows.length === 0) notFound();
  const category = res.rows[0];
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
    const rawCode = (formData.get("accessCode") as string) || "";
    const accessCode = rawCode.trim().toUpperCase().replace(/[\s-]+/g, "");
    
    if (!accessCode) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    // 1. Try matching the current category
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
    let targetCategoryId = categoryId;
    let targetSlug = slug;

    // 2. If not found in current category, search across all categories in this or other competitions
    if (!schoolAccess) {
      const crossRes = await pool.query(`
        SELECT sa.*, c.slug as "compSlug", qc.name as "categoryName"
        FROM school_access sa
        LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id
        LEFT JOIN competition c ON (qc."competitionId" = c.id OR sa."competitionId" = c.id)
        WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
        LIMIT 1
      `, [accessCode]);

      if (crossRes.rows.length > 0) {
        schoolAccess = crossRes.rows[0];
        targetCategoryId = schoolAccess.categoryId || categoryId;
        targetSlug = schoolAccess.compSlug || slug;
      }
    }

    if (!schoolAccess) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    // 3. Check if answers were already submitted
    const subRes = await pool.query(
      'SELECT id FROM quiz_submission WHERE "categoryId" = $1 AND "schoolAccessId" = $2',
      [targetCategoryId, schoolAccess.id]
    );
    if (subRes.rows.length > 0) {
      redirect(`/competitions/${targetSlug}/quiz/${targetCategoryId}?error=AlreadySubmitted`);
    }

    // 4. Set access cookie with lax SameSite for browser compatibility
    const cookieStore = await cookies();
    cookieStore.set(`quiz_access_${targetCategoryId}`, accessCode, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 2 // 2 hours
    });

    // 5. Redirect to quiz taker, passing code as query parameter backup
    redirect(`/competitions/${targetSlug}/quiz/${targetCategoryId}/take?code=${encodeURIComponent(accessCode)}`);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">{competitionTitle}</h1>
          <h2 className="text-xl font-semibold text-maroon-700 mb-2">{category.name} Quiz</h2>
          <p className="text-gray-600">Enter your school's access code for <strong>{category.name}</strong> to begin.</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-900 space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-orange-800">
            Important Rules & Guidelines
          </h3>
          <ul className="list-disc list-inside space-y-1 ml-1 text-orange-800/90 leading-relaxed">
            <li><strong>Automated progression:</strong> You cannot go to the next question manually. You must stay on each question until its timer ends.</li>
            <li>When the timer expires, you will automatically be moved to the next question.</li>
            <li>You <strong>cannot go backwards</strong> to previous questions.</li>
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
