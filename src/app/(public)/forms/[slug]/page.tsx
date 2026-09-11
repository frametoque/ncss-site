import pool from "@/lib/db";
import { notFound } from "next/navigation";
import { FormRenderer } from "@/components/forms/FormRenderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const formRes = await pool.query('SELECT title, description FROM "form" WHERE slug = $1 AND "isActive" = true', [slug]);
  
  if (formRes.rowCount === 0) {
    return { title: 'Form Not Found' };
  }

  const form = formRes.rows[0];
  return {
    title: `${form.title} | Nalanda College Science Society`,
    description: form.description || `Submit your response for ${form.title}.`,
  };
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const formRes = await pool.query('SELECT * FROM "form" WHERE slug = $1 AND "isActive" = true', [slug]);
  if (formRes.rowCount === 0) return notFound();
  
  const form = formRes.rows[0];
  
  const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1 ORDER BY "orderIndex" ASC', [form.id]);
  const fields = fieldsRes.rows;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <FormRenderer form={form} fields={fields} />
      </div>
    </div>
  );
}
