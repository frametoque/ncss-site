import { getQuizCategories, createQuizCategory, getSchoolAccesses } from "./actions";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { SchoolAccessManager } from "@/components/admin/SchoolAccessManager";
import { AcceptAnswersToggle } from "@/components/admin/AcceptAnswersToggle";
import { SubjectCard } from "@/components/admin/SubjectCard";
import pool from "@/lib/db";
import { groupCategoriesBySubject } from "@/lib/quizSubjects";

export default async function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = await getQuizCategories(id);
  const accesses = await getSchoolAccesses(id);
  const compRes = await pool.query('SELECT title, "acceptingQuizAnswers" FROM "competition" WHERE id = $1', [id]);
  const competitionTitle = compRes.rows[0]?.title || "Competition";
  const formsRes = await pool.query('SELECT id, title FROM "form" WHERE "competitionId" = $1', [id]);
  const linkedForms = formsRes.rows;

  const categoryIds = categories.map(c => c.id);
  const [qCountRes, subCountRes] = categoryIds.length > 0 ? await Promise.all([
    pool.query(
      'SELECT "categoryId", count(*)::int as count FROM quiz_question WHERE "categoryId" = ANY($1::text[]) GROUP BY "categoryId"',
      [categoryIds]
    ),
    pool.query(
      'SELECT "categoryId", count(*)::int as count FROM quiz_submission WHERE "categoryId" = ANY($1::text[]) GROUP BY "categoryId"',
      [categoryIds]
    )
  ]) : [{ rows: [] }, { rows: [] }];

  const questionCountObj: Record<string, number> = {};
  for (const r of qCountRes.rows) {
    questionCountObj[r.categoryId] = r.count;
  }

  const subCountMap = new Map<string, number>();
  for (const r of subCountRes.rows) {
    subCountMap.set(r.categoryId, r.count);
  }

  const subjects = groupCategoriesBySubject(categories);

  async function addAction(formData: FormData) {
    "use server";
    await createQuizCategory(
      id, 
      formData.get("name") as string, 
      Number(formData.get("totalTime")) || null,
      Number(formData.get("questionTimer")) || 60
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">Manage Quizzes</h1>
        <Link href={`/admin/competitions/${id}`} className="text-maroon-700/70 hover:text-maroon-800">Back to Competition</Link>
      </div>

      {/* Top Inline Section: Quiz Status & Add New Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 flex">
          <AcceptAnswersToggle competitionId={id} initialState={compRes.rows[0]?.acceptingQuizAnswers ?? true} />
        </div>

        <div className="lg:col-span-8 flex">
          <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm flex-1 flex flex-col justify-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-maroon-900 mb-3">Add New Subject / Category</h2>
            <form action={addAction} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-maroon-800 mb-1">Subject / Category Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full px-3 py-2 border border-maroon-200 rounded-lg text-sm bg-white" 
                  placeholder="e.g. Physics - Sinhala Medium" 
                />
              </div>
              <div className="w-full sm:w-36">
                <label className="block text-xs font-semibold text-maroon-800 mb-1">Timer (seconds)</label>
                <input 
                  type="number" 
                  name="questionTimer" 
                  defaultValue={60} 
                  min={5} 
                  required 
                  className="w-full px-3 py-2 border border-maroon-200 rounded-lg text-sm bg-white" 
                  placeholder="60" 
                />
              </div>
              <div className="w-full sm:w-auto">
                <SubmitButton>Add Subject</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Subjects Grid: Cards grouped per subject */}
      <div>
        {subjects.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-maroon-100 shadow-sm text-center text-maroon-500">
            No quiz categories created yet. Add one above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map(sub => {
              const totalSubs = sub.categories.reduce((acc, cat) => acc + (subCountMap.get(cat.id) || 0), 0);

              return (
                <SubjectCard
                  key={sub.subject}
                  competitionId={id}
                  competitionTitle={competitionTitle}
                  subject={sub.subject}
                  categories={sub.categories}
                  questionCountMap={questionCountObj}
                  totalSubmissions={totalSubs}
                />
              );
            })}
          </div>
        )}
      </div>

      <SchoolAccessManager 
        competitionId={id} 
        competitionTitle={competitionTitle}
        categories={categories} 
        initialAccesses={accesses} 
        linkedForms={linkedForms} 
      />
    </div>
  );
}
