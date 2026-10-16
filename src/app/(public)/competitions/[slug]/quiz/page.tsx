import pool from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { getSubjectName, parseCategorySubject, groupCategoriesBySubject } from "@/lib/quizSubjects";

export default async function GeneralQuizAccessPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const { slug } = await params;
  const { error, code: queryCode } = await searchParams;

  const [compRes, categoriesRes] = await Promise.all([
    pool.query('SELECT id, title, "acceptingQuizAnswers" FROM competition WHERE slug = $1', [slug]),
    pool.query(
      `SELECT qc.id, qc.name 
       FROM quiz_category qc
       JOIN competition c ON qc."competitionId" = c.id
       WHERE c.slug = $1
       ORDER BY qc.name ASC`,
      [slug]
    )
  ]);

  if (compRes.rows.length === 0) notFound();
  const competition = compRes.rows[0];
  const categories = categoriesRes.rows;

  if (!competition.acceptingQuizAnswers) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold font-heading text-gray-900 mb-2">{competition.title}</h1>
          <p className="text-gray-600">The quiz session is currently closed and not accepting answers.</p>
        </div>
      </div>
    );
  }

  // If a code was entered and resulted in multiple mediums for a subject, fetch them for selection
  const candidateRows = queryCode ? (await pool.query(
    `SELECT sa.*, qc.name as "categoryName", qc.id as "catId", c.slug as "compSlug"
     FROM school_access sa
     JOIN quiz_category qc ON sa."categoryId" = qc.id
     JOIN competition c ON (qc."competitionId" = c.id OR sa."competitionId" = c.id)
     WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
       AND (c.slug = $2 OR $2 IS NULL)
     ORDER BY qc.name ASC`,
    [queryCode.trim().toUpperCase().replace(/[\s-]+/g, ""), slug]
  )).rows : [];

  async function checkGeneralAccess(formData: FormData) {
    "use server";
    const rawCode = (formData.get("accessCode") as string) || "";
    const accessCode = rawCode.trim().toUpperCase().replace(/[\s-]+/g, "");

    if (!accessCode) {
      redirect(`/competitions/${slug}/quiz?error=InvalidAccessCode`);
    }

    // Find school access matching this code in this competition
    const accessRes = await pool.query(
      `SELECT sa.*, c.slug as "compSlug", qc.name as "categoryName"
       FROM school_access sa
       JOIN quiz_category qc ON sa."categoryId" = qc.id
       JOIN competition c ON (qc."competitionId" = c.id OR sa."competitionId" = c.id)
       WHERE UPPER(REPLACE(sa."accessCode", ' ', '')) = $1
         AND (c.slug = $2 OR $2 IS NULL)
       ORDER BY qc.name ASC`,
      [accessCode, slug]
    );

    if (accessRes.rows.length === 0) {
      redirect(`/competitions/${slug}/quiz?error=InvalidAccessCode`);
    }

    // If multiple categories match (e.g. English and Sinhala mediums for this subject)
    if (accessRes.rows.length > 1) {
      redirect(`/competitions/${slug}/quiz?code=${encodeURIComponent(accessCode)}`);
    }

    const schoolAccess = accessRes.rows[0];
    const targetSlug = schoolAccess.compSlug || slug;
    const targetCategoryId = schoolAccess.categoryId;

    if (!targetCategoryId) {
      redirect(`/competitions/${slug}/quiz?error=InvalidAccessCode`);
    }

    // Check if already submitted
    const subRes = await pool.query(
      'SELECT id FROM quiz_submission WHERE "categoryId" = $1 AND "schoolAccessId" = $2',
      [targetCategoryId, schoolAccess.id]
    );
    if (subRes.rows.length > 0) {
      redirect(`/competitions/${targetSlug}/quiz/${targetCategoryId}?error=AlreadySubmitted`);
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(`quiz_access_${targetCategoryId}`, accessCode, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 2
    });

    redirect(`/competitions/${targetSlug}/quiz/${targetCategoryId}/take?code=${encodeURIComponent(accessCode)}`);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">{competition.title}</h1>
          <h2 className="text-lg font-semibold text-maroon-700 mb-2">Quiz Portal</h2>
          <p className="text-gray-600 text-sm">
            Enter your school's 6-character access code below to enter your allocated quiz.
          </p>
        </div>

        {error === "InvalidAccessCode" && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            Invalid access code. Please check your code and try again.
          </div>
        )}

        {/* Medium Selection View if code belongs to multiple mediums */}
        {candidateRows.length > 0 ? (
          <div className="bg-maroon-50/80 border border-maroon-200 rounded-2xl p-5 mb-6 text-center shadow-xs">
            <h3 className="text-xl font-bold text-maroon-950 mt-0.5">{candidateRows[0].schoolName}</h3>
            <p className="text-sm text-maroon-800 font-medium mt-1">
              Subject: <span className="font-bold underline decoration-maroon-400">{getSubjectName(candidateRows[0].categoryName)}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1 mb-4">
              Your access code works for any medium in this subject. Please choose your medium:
            </p>

            <div className="space-y-2 max-w-sm mx-auto">
              {candidateRows.map(row => {
                const parsed = parseCategorySubject(row.categoryName);
                const mediumLabel = parsed.medium || row.categoryName;
                return (
                  <form key={row.catId} action={async () => {
                    "use server";
                    const targetCode = queryCode!.trim().toUpperCase().replace(/[\s-]+/g, "");
                    // Check if already submitted
                    const subRes = await pool.query(
                      'SELECT id FROM quiz_submission WHERE "categoryId" = $1 AND "schoolAccessId" = $2',
                      [row.catId, row.id]
                    );
                    if (subRes.rows.length > 0) {
                      redirect(`/competitions/${slug}/quiz/${row.catId}?error=AlreadySubmitted`);
                    }

                    const cookieStore = await cookies();
                    cookieStore.set(`quiz_access_${row.catId}`, targetCode, {
                      path: "/",
                      httpOnly: true,
                      sameSite: "lax",
                      maxAge: 60 * 60 * 2
                    });
                    redirect(`/competitions/${slug}/quiz/${row.catId}/take?code=${encodeURIComponent(targetCode)}`);
                  }}>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-maroon-100/70 border border-maroon-200 rounded-xl font-semibold text-sm text-maroon-900 transition-all shadow-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{mediumLabel}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-maroon-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                );
              })}
            </div>

            <div className="mt-4">
              <Link href={`/competitions/${slug}/quiz`} className="text-xs text-gray-500 hover:text-maroon-700 underline">
                Use a different access code
              </Link>
            </div>
          </div>
        ) : (
          <form action={checkGeneralAccess} className="space-y-4 mb-8">
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
                defaultValue={queryCode || ""}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-center text-lg tracking-widest uppercase focus:ring-maroon-500 focus:border-maroon-500"
                placeholder="e.g. A42J3N"
              />
            </div>

            <Button size="lg" type="submit" className="w-full rounded-xl h-12 text-base shadow-lg shadow-maroon-500/30 cursor-pointer">
              Enter Quiz
            </Button>
          </form>
        )}

        {categories.length > 0 && (() => {
          const subjects = groupCategoriesBySubject(categories);
          return (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
                Or choose your subject directly
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjects.map(sub => (
                  <Link
                    key={sub.subject}
                    href={`/competitions/${slug}/quiz/${sub.categories[0].id}${queryCode ? `?code=${encodeURIComponent(queryCode)}` : ""}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-maroon-300 hover:bg-maroon-50/50 transition-colors text-xs font-medium text-gray-700 hover:text-maroon-900 group"
                  >
                    <span className="truncate font-semibold">{sub.subject}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-maroon-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
