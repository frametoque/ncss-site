"use server";

import pool from "@/lib/db";
import { put } from "@vercel/blob";

export async function submitPublicForm(formId: string, formData: FormData) {
  // Fetch form and fields to validate
  const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1 AND "isActive" = true', [formId]);
  if (formRes.rowCount === 0) throw new Error("Form is not active or not found.");

  const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1', [formId]);
  const fields = fieldsRes.rows;

  const finalData: Record<string, any> = {};

  for (const field of fields) {
    const isRequired = field.isRequired;
    
    if (field.type === 'CHECKBOX') {
      const values = formData.getAll(field.id);
      if (isRequired && values.length === 0) throw new Error(`Field ${field.label} is required.`);
      
      if (field.validation) {
        const config = typeof field.validation === 'string' ? JSON.parse(field.validation) : field.validation;
        if (config.maxSelect && values.length > config.maxSelect) {
          throw new Error(`You can select a maximum of ${config.maxSelect} options for ${field.label}.`);
        }
      }
      
      finalData[field.id] = values;
    } else if (field.type === 'FILE') {
      const files = formData.getAll(field.id) as File[];
      // Filter out any empty dummy files that might be submitted
      const validFiles = files.filter(f => f && f.size > 0);
      
      if (isRequired && validFiles.length === 0) throw new Error(`Field ${field.label} is required.`);
      
      if (validFiles.length > 0) {
        const config = typeof field.validation === 'string' ? JSON.parse(field.validation || '{}') : (field.validation || {});
        const maxFiles = config.maxFiles || 1;
        
        if (validFiles.length > maxFiles) {
          throw new Error(`You can upload a maximum of ${maxFiles} files for ${field.label}.`);
        }
        
        const uploadedUrls: string[] = [];
        
        for (const file of validFiles) {
          // Validate constraints
          if (config.maxSizeMb && (file.size / (1024 * 1024)) > config.maxSizeMb) {
            throw new Error(`File ${file.name} exceeds the maximum size of ${config.maxSizeMb}MB.`);
          }
          if (config.allowedFileTypes && config.allowedFileTypes.length > 0) {
            const ext = "." + file.name.split('.').pop()?.toLowerCase();
            if (!config.allowedFileTypes.includes(ext)) {
              throw new Error(`File type ${ext} is not allowed for ${field.label}.`);
            }
          }
          
          // Upload to Vercel blob
          const { url } = await put(`submissions/${formId}/${file.name}`, file, { access: 'public' });
          uploadedUrls.push(url);
        }
        
        // If maxFiles is 1, store as string (for backwards compatibility), otherwise store array
        finalData[field.id] = maxFiles === 1 ? uploadedUrls[0] : uploadedUrls;
      } else {
        finalData[field.id] = null;
      }
    } else {
      const value = formData.get(field.id) as string;
      if (isRequired && !value) throw new Error(`Field ${field.label} is required.`);
      finalData[field.id] = value || null;
    }
  }

  // Retrieve built-in system email
  const systemEmail = formData.get('__system_email') as string;
  if (!systemEmail) throw new Error("Email Address is required.");

  const form = formRes.rows[0];

  if (form.limitOnePerEmail) {
    const existingRes = await pool.query(
      'SELECT id FROM "formSubmission" WHERE "formId" = $1 AND "submitterEmail" = $2 LIMIT 1',
      [formId, systemEmail]
    );
    if (existingRes.rowCount !== null && existingRes.rowCount > 0) {
      throw new Error("You have already submitted a response using this email address.");
    }
  }

  // Save submission
  await pool.query(
    'INSERT INTO "formSubmission" (id, "formId", "submitterEmail", data, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, now(), now())',
    [formId, systemEmail, JSON.stringify(finalData)]
  );
  
  return { success: true };
}
