"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createForm(data: { title: string; description: string; competitionId: string | null; slug: string; limitOnePerEmail?: boolean }) {
  const res = await pool.query(
    'INSERT INTO "form" (id, slug, title, description, "competitionId", "isActive", "limitOnePerEmail", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, $5, now(), now()) RETURNING id',
    [data.slug, data.title, data.description || null, data.competitionId || null, data.limitOnePerEmail ?? false]
  );
  revalidatePath("/admin/forms");
  return res.rows[0].id;
}

export async function updateForm(id: string, data: { title: string; description: string; competitionId: string | null; slug: string; isActive: boolean; limitOnePerEmail?: boolean; successMessage?: string | null }) {
  await pool.query(
    'UPDATE "form" SET title = $1, description = $2, "competitionId" = $3, slug = $4, "isActive" = $5, "limitOnePerEmail" = $6, "successMessage" = $7, "updatedAt" = now() WHERE id = $8',
    [data.title, data.description || null, data.competitionId || null, data.slug, data.isActive, data.limitOnePerEmail ?? false, data.successMessage || null, id]
  );
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}`);
}

export async function deleteForm(id: string) {
  // Cascades will handle fields and submissions if set up correctly, but let's be explicit just in case
  await pool.query('DELETE FROM "formField" WHERE "formId" = $1', [id]);
  await pool.query('DELETE FROM "formSubmission" WHERE "formId" = $1', [id]);
  await pool.query('DELETE FROM "form" WHERE id = $1', [id]);
  revalidatePath("/admin/forms");
}

export async function saveFormFields(formId: string, fields: any[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Simple sync: delete all fields and re-insert
    await client.query('DELETE FROM "formField" WHERE "formId" = $1', [formId]);
    
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      await client.query(
        'INSERT INTO "formField" (id, "formId", type, label, placeholder, "isRequired", options, validation, "orderIndex", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())',
        [
          f.id, 
          formId, 
          f.type, 
          f.label, 
          f.placeholder || null, 
          !!f.isRequired, 
          f.options ? JSON.stringify(f.options) : null, 
          f.validation ? JSON.stringify(f.validation) : null, 
          i
        ]
      );
    }
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  revalidatePath(`/admin/forms/${formId}`);
}

export async function deleteSubmission(formId: string, submissionId: string) {
  await pool.query('DELETE FROM "formSubmission" WHERE id = $1', [submissionId]);
  revalidatePath(`/admin/forms/${formId}/submissions`);
}
