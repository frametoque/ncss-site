import { getQuizCategory, getQuizQuestions, updateQuizCategory } from "../actions";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { QuizManager } from "@/components/admin/QuizManager";

export default async function CategoryPage({ params }: { params: Promise<{ id: string, categoryId: string }> }) {
  const { id, categoryId } = await params;
  const [category, questions] = await Promise.all([
    getQuizCategory(categoryId),
    getQuizQuestions(categoryId),
  ]);

  if (!category) {
    return <div>Category not found</div>;
  }

  async function updateAction(formData: FormData) {
    "use server";
    await updateQuizCategory(
      categoryId, 
      formData.get("name") as string, 
      null,
      Number(formData.get("questionTimer")) || 60
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">Manage: {category.name}</h1>
        <Link href={`/admin/competitions/${id}/quizzes`} className="text-maroon-700/70 hover:text-maroon-800">Back to Quizzes</Link>
      </div>

      <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm">
        <h2 className="text-lg font-semibold text-maroon-900 mb-4">Subject Settings</h2>
        <form action={updateAction} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-maroon-800 mb-1">Subject / Category Name</label>
            <input type="text" name="name" defaultValue={category.name} required className="w-full px-3 py-2 border border-maroon-200 rounded-lg" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-maroon-800 mb-1">Per-Question Timer (seconds)</label>
            <input type="number" name="questionTimer" defaultValue={category.questionTimer || 60} min={5} required className="w-full px-3 py-2 border border-maroon-200 rounded-lg" placeholder="e.g. 60" />
          </div>
          <SubmitButton>Update Settings</SubmitButton>
        </form>
      </div>

      <QuizManager category={category} initialQuestions={questions} />
    </div>
  );
}
