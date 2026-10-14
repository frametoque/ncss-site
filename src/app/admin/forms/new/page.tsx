import pool from "@/lib/db";
import { createForm } from "../../form-actions";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const dynamic = "force-dynamic";

export default async function NewForm() {
  const compRes = await pool.query('SELECT id, title FROM "competition" ORDER BY "orderIndex" ASC NULLS LAST, "createdAt" DESC');
  const competitions = compRes.rows;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-maroon-900 mb-6">Create New Form</h1>
      
      <form action={async (formData) => {
        "use server";
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const slug = formData.get("slug") as string;
        let competitionId = formData.get("competitionId") as string | null;
        if (competitionId === "none") competitionId = null;
        const limitOnePerEmail = formData.get("limitOnePerEmail") === "true";
        
        const newFormId = await createForm({ title, description, slug, competitionId, limitOnePerEmail });
        
        const { redirect } = await import("next/navigation");
        redirect(`/admin/forms/${newFormId}/edit`);
      }} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-maroon-100">
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-maroon-950 mb-2">Form Title</label>
          <input type="text" id="title" name="title" required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
        </div>
        
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-maroon-950 mb-2">URL Slug</label>
          <input type="text" id="slug" name="slug" required placeholder="e.g. inter-school-quiz" className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          <p className="text-xs text-gray-500 mt-1">This will be used for the public link: /forms/your-slug</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-maroon-950 mb-2">Description</label>
          <textarea id="description" name="description" rows={3} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"></textarea>
        </div>

        <div>
          <label htmlFor="competitionId" className="block text-sm font-medium text-maroon-950 mb-2">Link to Competition (Optional)</label>
          <select id="competitionId" name="competitionId" className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500 bg-white">
            <option value="none">-- Standalone Form --</option>
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Linked forms will automatically appear on the competition's page.</p>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="limitOnePerEmail" name="limitOnePerEmail" value="true" className="rounded text-maroon-600 focus:ring-maroon-500" />
          <label htmlFor="limitOnePerEmail" className="text-sm font-medium text-maroon-950">Limit to 1 response per email</label>
        </div>

        <SubmitButton>Create Form & Continue to Builder</SubmitButton>
      </form>
    </div>
  );
}
