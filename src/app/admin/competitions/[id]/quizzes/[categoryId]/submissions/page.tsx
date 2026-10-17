import pool from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubjectName, parseCategorySubject } from "@/lib/quizSubjects";
import { QuizSubmissionsTable, SubmissionRow } from "@/components/admin/QuizSubmissionsTable";
import { ArrowLeft, Trophy } from "lucide-react";

export default async function SubmissionsPage({ 
  params 
}: { 
  params: Promise<{ id: string, categoryId: string }> 
}) {
  const { id, categoryId } = await params;

  // 1. Fetch current category and competition info
  const [catRes, compRes] = await Promise.all([
    pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]),
    pool.query('SELECT id, title FROM competition WHERE id = $1', [id])
  ]);

  if (catRes.rows.length === 0) {
    notFound();
  }

  const category = catRes.rows[0];
  const competition = compRes.rows[0];
  const subjectName = getSubjectName(category.name);

  // 2. Fetch all categories belonging to this subject in this competition
  const allCatsRes = await pool.query(
    'SELECT * FROM quiz_category WHERE "competitionId" = $1 ORDER BY name ASC',
    [id]
  );
  const subjectCategories = allCatsRes.rows.filter(
    c => getSubjectName(c.name).toLowerCase() === subjectName.toLowerCase()
  );
  const subjectCategoryIds = subjectCategories.map(c => c.id);

  // 3. Fetch all submissions for any medium in this subject
  const subsRes = await pool.query(`
    SELECT qs.*, sa."schoolName", qc.name as "categoryName"
    FROM quiz_submission qs
    JOIN school_access sa ON qs."schoolAccessId" = sa.id
    JOIN quiz_category qc ON qs."categoryId" = qc.id
    WHERE qs."categoryId" = ANY($1::text[])
    ORDER BY qs."createdAt" DESC
  `, [subjectCategoryIds]);

  // 4. Fetch questions for all relevant categories
  const questionsRes = await pool.query(
    'SELECT id, "categoryId", "questionText", "correctOption", "orderIndex" FROM quiz_question WHERE "categoryId" = ANY($1::text[]) ORDER BY "orderIndex" ASC NULLS LAST, id ASC',
    [subjectCategoryIds]
  );

  const questionsByCatId = new Map<string, any[]>();
  for (const q of questionsRes.rows) {
    if (!questionsByCatId.has(q.categoryId)) {
      questionsByCatId.set(q.categoryId, []);
    }
    questionsByCatId.get(q.categoryId)!.push(q);
  }

  // 5. Build standardized SubmissionRow objects
  const submissionRows: SubmissionRow[] = subsRes.rows.map(sub => {
    const parsed = parseCategorySubject(sub.categoryName);
    const medium = parsed.medium || sub.categoryName;
    const catQuestions = questionsByCatId.get(sub.categoryId) || [];

    return {
      id: sub.id,
      categoryId: sub.categoryId,
      categoryName: sub.categoryName,
      medium,
      schoolName: sub.schoolName,
      score: sub.score,
      totalQuestions: catQuestions.length,
      totalTimeLeft: sub.totalTimeLeft || 0,
      createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString(),
      answers: sub.answers || {},
      questions: catQuestions
    };
  });

  // Sort by score DESC, then totalTimeLeft DESC, then createdAt ASC
  submissionRows.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.totalTimeLeft !== b.totalTimeLeft) return b.totalTimeLeft - a.totalTimeLeft;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/admin/competitions/${id}/quizzes`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-700/80 hover:text-maroon-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Quizzes
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-maroon-950 flex items-center gap-3">
            <span>{subjectName} Submissions</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Combined results across all mediums ({subjectCategories.map(c => parseCategorySubject(c.name).medium || c.name).join(", ")})
          </p>
        </div>
      </div>

      {/* Submissions Table Component with Medium Filters, Search, Badges */}
      <QuizSubmissionsTable
        submissions={submissionRows}
        subjectName={subjectName}
        competitionTitle={competition?.title || "Competition"}
      />
    </div>
  );
}
