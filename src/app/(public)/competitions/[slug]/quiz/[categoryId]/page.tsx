import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { getSubjectName, parseCategorySubject } from "@/lib/quizSubjects";

export default async function QuizAccessPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string, categoryId: string }>, 
  searchParams: Promise<{ error?: string; code?: string }> 
}) {
  const { slug, categoryId } = await params;
  const { error, code } = await searchParams;

  const [res, compRes] = await Promise.all([
    pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]),
    pool.query('SELECT id, title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug])
  ]);
  if (res.rows.length === 0) notFound();
  const category = res.rows[0];
  const competition = compRes.rows[0];
  const competitionTitle = competition?.title || 'Competition';
  const subjectName = getSubjectName(category.name);

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

  // Fetch all categories for this competition to find all mediums belonging to this subject
  const allCatsRes = await pool.query(
    'SELECT id, name FROM quiz_category WHERE "competitionId" = $1 ORDER BY name ASC',
    [competition.id]
  );
  const subjectCategories = allCatsRes.rows.filter(
    c => getSubjectName(c.name).toLowerCase() === subjectName.toLowerCase()
  );

  // If access code was provided, validate it and check if school already submitted
  let candidateSchool: { schoolName: string; accessCode: string; competitionId: string } | null = null;
  let alreadySubmittedForSubject = false;
  let invalidCodeProvided = false;

  if (code) {
    const cleanCode = code.trim().toUpperCase().replace(/[\s-]+/g, "");
    
    // Look for matching school_access in this competition
    const accessRes = await pool.query(`
      SELECT sa.*, qc.name as "categoryName"
      FROM school_access sa
      LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id
      WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
        AND sa."competitionId" = $2
    `, [cleanCode, competition.id]);

    const subjectMatch = accessRes.rows.find(
      r => getSubjectName(r.categoryName || "").toLowerCase() === subjectName.toLowerCase()
    );

    if (subjectMatch) {
      candidateSchool = {
        schoolName: subjectMatch.schoolName,
        accessCode: cleanCode,
        competitionId: subjectMatch.competitionId
      };

      // Check if answers were already submitted for this subject by this school
      const subRes = await pool.query(`
        SELECT qs.id, qc.name as "categoryName" 
        FROM quiz_submission qs
        JOIN school_access sa ON qs."schoolAccessId" = sa.id
        JOIN quiz_category qc ON qs."categoryId" = qc.id
        WHERE LOWER(TRIM(sa."schoolName")) = LOWER(TRIM($1))
          AND sa."competitionId" = $2
      `, [candidateSchool.schoolName, competition.id]);

      alreadySubmittedForSubject = subRes.rows.some(
        r => getSubjectName(r.categoryName || "").toLowerCase() === subjectName.toLowerCase()
      );
    } else {
      invalidCodeProvided = true;
    }
  }

  // Server action to verify access code input
  async function checkAccess(formData: FormData) {
    "use server";
    const rawCode = (formData.get("accessCode") as string) || "";
    const accessCode = rawCode.trim().toUpperCase().replace(/[\s-]+/g, "");
    
    if (!accessCode) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    // Check code in this competition
    const accessRes = await pool.query(`
      SELECT sa.*, qc.name as "categoryName", qc.id as "catId"
      FROM school_access sa
      LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id
      WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
        AND sa."competitionId" = $2
    `, [accessCode, competition.id]);

    if (accessRes.rows.length === 0) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    // Match this subject
    const subjectMatch = accessRes.rows.find(
      r => getSubjectName(r.categoryName || "").toLowerCase() === subjectName.toLowerCase()
    );

    if (subjectMatch) {
      // Check already submitted
      const subRes = await pool.query(`
        SELECT qs.id, qc.name as "categoryName" 
        FROM quiz_submission qs
        JOIN school_access sa ON qs."schoolAccessId" = sa.id
        JOIN quiz_category qc ON qs."categoryId" = qc.id
        WHERE LOWER(TRIM(sa."schoolName")) = LOWER(TRIM($1))
          AND sa."competitionId" = $2
      `, [subjectMatch.schoolName, competition.id]);

      const alreadySub = subRes.rows.some(
        r => getSubjectName(r.categoryName || "").toLowerCase() === subjectName.toLowerCase()
      );

      if (alreadySub) {
        redirect(`/competitions/${slug}/quiz/${categoryId}?error=AlreadySubmitted`);
      }

      redirect(`/competitions/${slug}/quiz/${categoryId}?code=${encodeURIComponent(accessCode)}`);
    }

    // If code belongs to another subject in this competition, intelligently redirect there
    const otherMatch = accessRes.rows[0];
    if (otherMatch && otherMatch.catId) {
      redirect(`/competitions/${slug}/quiz/${otherMatch.catId}?code=${encodeURIComponent(accessCode)}`);
    }

    redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
  }

  // Server action when medium is selected
  async function selectMediumAction(formData: FormData) {
    "use server";
    const targetCatId = formData.get("targetCategoryId") as string;
    const accessCode = formData.get("accessCode") as string;

    if (!targetCatId || !accessCode) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    // Verify school access exists
    const accessRes = await pool.query(`
      SELECT sa.*, qc.name as "categoryName"
      FROM school_access sa
      LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id
      WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
        AND sa."competitionId" = $2
    `, [accessCode, competition.id]);

    if (accessRes.rows.length === 0) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=InvalidAccessCode`);
    }

    const schoolAccess = accessRes.rows[0];

    // Check if already submitted for this subject
    const subRes = await pool.query(`
      SELECT qs.id, qc.name as "categoryName" 
      FROM quiz_submission qs
      JOIN school_access sa ON qs."schoolAccessId" = sa.id
      JOIN quiz_category qc ON qs."categoryId" = qc.id
      WHERE LOWER(TRIM(sa."schoolName")) = LOWER(TRIM($1))
        AND sa."competitionId" = $2
    `, [schoolAccess.schoolName, competition.id]);

    const alreadyDone = subRes.rows.some(
      r => getSubjectName(r.categoryName || "").toLowerCase() === subjectName.toLowerCase()
    );

    if (alreadyDone) {
      redirect(`/competitions/${slug}/quiz/${categoryId}?error=AlreadySubmitted`);
    }

    // Ensure a specific school_access entry exists for this category
    const specificRes = await pool.query(
      'SELECT id FROM school_access WHERE "competitionId" = $1 AND "categoryId" = $2 AND LOWER(TRIM("schoolName")) = LOWER(TRIM($3))',
      [competition.id, targetCatId, schoolAccess.schoolName]
    );

    if (specificRes.rows.length === 0) {
      await pool.query(
        'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
        [competition.id, targetCatId, schoolAccess.schoolName, accessCode]
      );
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(`quiz_access_${targetCatId}`, accessCode, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 2
    });

    redirect(`/competitions/${slug}/quiz/${targetCatId}/take?code=${encodeURIComponent(accessCode)}`);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">{competitionTitle}</h1>
          <h2 className="text-xl font-bold text-maroon-700 mb-1">{subjectName} Quiz</h2>
          {!candidateSchool && (
            <p className="text-gray-600 text-sm mt-1">
              Enter your school's access code for <strong>{subjectName}</strong> to begin.
            </p>
          )}
        </div>

        {(error === 'InvalidAccessCode' || invalidCodeProvided) && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            Invalid access code. Please check your code and try again.
          </div>
        )}
        
        {(error === 'AlreadySubmitted' || alreadySubmittedForSubject) && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            {candidateSchool?.schoolName ? `${candidateSchool.schoolName} has` : "Your school has"} already submitted answers for {subjectName}.
          </div>
        )}

        {/* Medium Selection View after valid access code */}
        {candidateSchool && !alreadySubmittedForSubject ? (
          <div className="bg-maroon-50/80 border border-maroon-200 rounded-2xl p-5 mb-4 text-center shadow-xs">
            <h3 className="text-xl font-bold text-maroon-950 mt-0.5">{candidateSchool.schoolName}</h3>
            <p className="text-sm text-maroon-800 font-medium mt-1">
              Subject: <span className="font-bold underline decoration-maroon-400">{subjectName}</span>
            </p>
            <p className="text-xs text-gray-600 mt-2 mb-4">
              Please choose the medium you wish to take this quiz in:
            </p>

            <div className="space-y-2.5 max-w-sm mx-auto">
              {subjectCategories.map(cat => {
                const parsed = parseCategorySubject(cat.name);
                const mediumLabel = parsed.medium || cat.name;
                return (
                  <form key={cat.id} action={selectMediumAction}>
                    <input type="hidden" name="targetCategoryId" value={cat.id} />
                    <input type="hidden" name="accessCode" value={candidateSchool.accessCode} />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-maroon-100/70 border border-maroon-200 rounded-xl font-semibold text-sm text-maroon-900 transition-all shadow-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{mediumLabel}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-maroon-700 font-medium">
                        <span>Start</span>
                        <ArrowRight className="w-4 h-4 text-maroon-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </form>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-maroon-100">
              <Link href={`/competitions/${slug}/quiz/${categoryId}`} className="text-xs text-gray-500 hover:text-maroon-700 underline">
                Use a different access code
              </Link>
            </div>
          </div>
        ) : !alreadySubmittedForSubject ? (
          <>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-900 space-y-2">
              <h3 className="font-bold flex items-center gap-2 text-orange-800">
                Important Rules & Guidelines
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-1 text-orange-800/90 leading-relaxed text-xs">
                <li><strong>Automated progression:</strong> You must stay on each question until its timer ends.</li>
                <li>When the timer expires, you will automatically be moved to the next question.</li>
                <li>You <strong>cannot go backwards</strong> to previous questions.</li>
                <li><strong>Do not leave the tab.</strong> If you switch tabs, you have 10 seconds to return.</li>
                <li>Copying text, right-clicking, and keyboard shortcuts are strictly disabled.</li>
              </ul>
            </div>

            <form action={checkAccess} className="space-y-5">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
                  School Access Code
                </label>
                <input 
                  type="text" 
                  id="accessCode" 
                  name="accessCode" 
                  required 
                  autoComplete="off"
                  defaultValue={code || ""}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-center text-lg tracking-widest uppercase focus:ring-maroon-500 focus:border-maroon-500"
                  placeholder="e.g. A1B2C3"
                />
                <p className="text-[11px] text-gray-400 text-center mt-1.5">
                  (One access code works for all mediums of {subjectName})
                </p>
              </div>
              
              <Button size="lg" type="submit" className="w-full rounded-xl h-12 text-base shadow-lg shadow-maroon-500/30 cursor-pointer">
                Enter Quiz
              </Button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
