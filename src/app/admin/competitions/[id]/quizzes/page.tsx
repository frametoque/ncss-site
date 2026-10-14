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

      <AcceptAnswersToggle competitionId={id} initialState={compRes.rows[0]?.acceptingQuizAnswers ?? true} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm">
            <h2 className="text-lg font-semibold text-maroon-900 mb-4">Add New Subject / Category</h2>
            <form action={addAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-maroon-800 mb-1">Subject / Category Name</label>
                <input type="text" name="name" required className="w-full px-3 py-2 border border-maroon-200 rounded-lg" placeholder="e.g. Physics - Sinhala Medium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-maroon-800 mb-1">Per-Question Timer (seconds)</label>
                <input type="number" name="questionTimer" defaultValue={60} min={5} required className="w-full px-3 py-2 border border-maroon-200 rounded-lg" placeholder="e.g. 60" />
              </div>
              <SubmitButton>Add Subject</SubmitButton>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          {categories.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm text-center text-maroon-500">
              No quiz categories created yet.
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-maroon-900">{cat.name}</h3>
                  <p className="text-xs text-maroon-600">
                    Timer: {cat.questionTimer || 60} seconds per question
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/competitions/${id}/quizzes/${cat.id}`} className="px-3 py-1.5 bg-maroon-100 text-maroon-800 rounded-md text-sm font-medium hover:bg-maroon-200">
                    Manage Quiz
                  </Link>
                  <Link href={`/admin/competitions/${id}/quizzes/${cat.id}/submissions`} className="px-3 py-1.5 bg-maroon-50 text-maroon-700 rounded-md text-sm font-medium hover:bg-maroon-100 border border-maroon-200">
                    Submissions
                  </Link>
                  <form action={deleteAction}>
                    <input type="hidden" name="categoryId" value={cat.id} />
                    <button type="submit" className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 border border-red-200">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <SchoolAccessManager competitionId={id} categories={categories} initialAccesses={accesses} />
    </div>
  );
}
