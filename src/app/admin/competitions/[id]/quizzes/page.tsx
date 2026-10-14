import { getQuizCategories, createQuizCategory, deleteQuizCategory, getSchoolAccesses } from "./actions";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { SchoolAccessManager } from "@/components/admin/SchoolAccessManager";
import { AcceptAnswersToggle } from "@/components/admin/AcceptAnswersToggle";
import pool from "@/lib/db";

export default async function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = await getQuizCategories(id);
  const accesses = await getSchoolAccesses(id);
  const compRes = await pool.query('SELECT "acceptingQuizAnswers" FROM "competition" WHERE id = $1', [id]);
  const formsRes = await pool.query('SELECT id, title FROM "form" WHERE "competitionId" = $1', [id]);
  const linkedForms = formsRes.rows;

  async function addAction(formData: FormData) {
    "use server";
    await createQuizCategory(
      id, 
      formData.get("name") as string, 
      Number(formData.get("totalTime")) || null,
      Number(formData.get("questionTimer")) || 60
    );
  }

  async function deleteAction(formData: FormData) {
    "use server";
    await deleteQuizCategory(id, formData.get("categoryId") as string);
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

      {/* Subjects Grid: 3 cards per row */}
      <div>
        {categories.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-maroon-100 shadow-sm text-center text-maroon-500">
            No quiz categories created yet. Add one above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="bg-white p-5 rounded-xl border border-maroon-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-bold text-maroon-900 mb-1 leading-snug">{cat.name}</h3>
                  <p className="text-xs text-maroon-600">
                    Timer: {cat.questionTimer || 60} seconds per question
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-maroon-50">
                  <Link 
                    href={`/admin/competitions/${id}/quizzes/${cat.id}`} 
                    className="flex-1 text-center py-2 px-2 bg-maroon-100 text-maroon-800 rounded-lg text-xs font-semibold hover:bg-maroon-200 transition-colors"
                  >
                    Manage Quiz
                  </Link>
                  <Link 
                    href={`/admin/competitions/${id}/quizzes/${cat.id}/submissions`} 
                    className="flex-1 text-center py-2 px-2 bg-maroon-50 text-maroon-700 rounded-lg text-xs font-semibold hover:bg-maroon-100 border border-maroon-200 transition-colors"
                  >
                    Submissions
                  </Link>
                  <form action={deleteAction}>
                    <input type="hidden" name="categoryId" value={cat.id} />
                    <button 
                      type="submit" 
                      className="px-2.5 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SchoolAccessManager competitionId={id} categories={categories} initialAccesses={accesses} linkedForms={linkedForms} />
    </div>
  );
}
