import pool from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1', [id]);
  if (formRes.rowCount === 0) return notFound();
  const form = formRes.rows[0];

  const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1 ORDER BY "orderIndex" ASC', [id]);
  const fields = fieldsRes.rows;

  const subRes = await pool.query('SELECT * FROM "formSubmission" WHERE "formId" = $1 ORDER BY "createdAt" DESC', [id]);
  const submissions = subRes.rows;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/admin/forms" className="text-maroon-600 hover:underline flex items-center text-sm font-medium mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Forms
          </Link>
          <h1 className="text-3xl font-bold text-maroon-900">Submissions: {form.title}</h1>
          <p className="text-maroon-700/70 mt-1">Total submissions: {submissions.length}</p>
        </div>
        
        <Link 
          href={`/api/forms/${id}/export`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-maroon-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-maroon-50/50 border-b border-maroon-100">
                <th className="p-4 font-semibold text-maroon-900">Date</th>
                <th className="p-4 font-semibold text-maroon-900">Submitter Email</th>
                {fields.map(f => (
                  <th key={f.id} className="p-4 font-semibold text-maroon-900">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 2} className="p-8 text-center text-maroon-400">
                    No submissions yet.
                  </td>
                </tr>
              ) : submissions.map((sub) => {
                const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
                return (
                  <tr key={sub.id} className="border-b border-maroon-50 hover:bg-maroon-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {sub.submitterEmail}
                    </td>
                    {fields.map(f => {
                      const val = data[f.id];
                      return (
                        <td key={f.id} className="p-4 text-gray-800 max-w-xs truncate">
                          {f.type === 'FILE' && val ? (
                            Array.isArray(val) ? (
                              <div className="flex flex-col gap-1">
                                {val.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-maroon-700 hover:underline text-xs">
                                    View File {i + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <a href={val} target="_blank" rel="noopener noreferrer" className="text-maroon-700 hover:underline">View File</a>
                            )
                          ) : (
                            String(val || '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
