import pool from "@/lib/db";
import Link from "next/link";
import { Plus, Edit2, List, Trash2, Globe } from "lucide-react";
import { deleteForm } from "../form-actions";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function FormsList() {
  const formsRes = await pool.query(`
    SELECT f.*, c.title as "competitionTitle",
           (SELECT COUNT(*) FROM "formSubmission" s WHERE s."formId" = f.id) as "submissionCount"
    FROM "form" f
    LEFT JOIN "competition" c ON f."competitionId" = c.id
    ORDER BY f."createdAt" DESC
  `);
  const forms = formsRes.rows;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-maroon-900">Forms</h1>
        </div>
        <Link 
          href="/admin/forms/new" 
          className="bg-maroon-800 hover:bg-maroon-900 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Form
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-maroon-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-maroon-50/50 border-b border-maroon-100">
                <th className="p-4 font-semibold text-maroon-900">Title</th>
                <th className="p-4 font-semibold text-maroon-900">Linked Competition</th>
                <th className="p-4 font-semibold text-maroon-900">Submissions</th>
                <th className="p-4 font-semibold text-maroon-900">Status</th>
                <th className="p-4 font-semibold text-maroon-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-maroon-400">
                    No forms found. Create one to get started!
                  </td>
                </tr>
              ) : forms.map((form) => (
                <tr key={form.id} className="border-b border-maroon-50 hover:bg-maroon-50/50 transition-colors">
                  <td className="p-4 font-medium text-maroon-950">
                    <div>{form.title}</div>
                    <div className="text-xs text-gray-500 font-normal truncate max-w-xs">{form.description}</div>
                  </td>
                  <td className="p-4 text-maroon-700">
                    {form.competitionTitle ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-maroon-50 text-maroon-700 text-xs font-medium border border-maroon-100">
                        <TrophyIcon className="w-3.5 h-3.5" />
                        {form.competitionTitle}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Standalone</span>
                    )}
                  </td>
                  <td className="p-4 text-maroon-700 font-semibold">
                    <Link href={`/admin/forms/${form.id}/submissions`} className="hover:underline flex items-center gap-2">
                      <List className="w-4 h-4" />
                      {form.submissionCount}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/forms/${form.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 text-maroon-700 hover:bg-maroon-50 rounded-lg transition-colors" title="View Public Form">
                        <Globe className="w-4 h-4" />
                      </a>
                      <Link href={`/admin/forms/${form.id}/edit`} className="p-2 text-maroon-700 hover:bg-maroon-100 rounded-lg transition-colors" title="Edit Form">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <form action={async () => { "use server"; await deleteForm(form.id); }}>
                        <DeleteButton />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7c0 3.31 2.69 6 6 6s6-2.69 6-6V2Z"/>
    </svg>
  );
}
