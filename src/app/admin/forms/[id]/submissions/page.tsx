import pool from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import SubmissionsTable from "./SubmissionsTable";
import { rewriteDataUrls } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1', [id]);
  if (formRes.rowCount === 0) return notFound();
  const form = formRes.rows[0];

  const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1 ORDER BY "orderIndex" ASC', [id]);
  const rawFields = fieldsRes.rows;

  let currentSection = "";
  const fields: any[] = [];
  for (const f of rawFields) {
    if (f.type === 'SECTION_DIVIDER') {
      currentSection = f.label;
    } else {
      fields.push({
        ...f,
        displayLabel: currentSection ? `${currentSection} - ${f.label}` : f.label
      });
    }
  }

  const subRes = await pool.query('SELECT * FROM "formSubmission" WHERE "formId" = $1 ORDER BY "createdAt" DESC', [id]);
  const submissions = subRes.rows.map(row => ({
    ...row,
    data: rewriteDataUrls(row.data)
  }));

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

      <SubmissionsTable fields={fields} submissions={submissions} formId={form.id} />
    </div>
  );
}
