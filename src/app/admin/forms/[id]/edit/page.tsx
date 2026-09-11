import pool from "@/lib/db";
import { notFound } from "next/navigation";
import FormBuilderClient from "./FormBuilderClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1', [id]);
  if (formRes.rowCount === 0) return notFound();
  
  const form = formRes.rows[0];

  const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1 ORDER BY "orderIndex" ASC', [id]);
  const fields = fieldsRes.rows;

  const compRes = await pool.query('SELECT id, title FROM "competition" ORDER BY "createdAt" DESC');
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/forms" className="text-maroon-600 hover:underline flex items-center text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Forms
        </Link>
      </div>
      <FormBuilderClient form={form} initialFields={fields} competitions={compRes.rows} />
    </div>
  );
}
