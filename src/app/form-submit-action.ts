"use server";

import pool from "@/lib/db";
import { uploadFile, getUniqueKey } from "@/lib/storage";

export async function submitPublicForm(
  formId: string, 
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch form and fields to validate
    const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1 AND "isActive" = true', [formId]);
    if (formRes.rowCount === 0) {
      return { success: false, error: "Form is not active or not found." };
    }

    const formRow = formRes.rows[0];
    const formSlug = ((formRow.slug || formRow.title || formId) as string)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1', [formId]);
    const fields = fieldsRes.rows;

    const finalData: Record<string, any> = {};

    for (const field of fields) {
      const isRequired = field.isRequired;
      
      if (field.type === 'CHECKBOX') {
        const values = formData.getAll(field.id);
        if (isRequired && values.length === 0) {
          return { success: false, error: `Field "${field.label}" is required.` };
        }
        
        if (field.validation) {
          const config = typeof field.validation === 'string' ? JSON.parse(field.validation) : field.validation;
          if (config.maxSelect && values.length > config.maxSelect) {
            return { success: false, error: `You can select a maximum of ${config.maxSelect} options for "${field.label}".` };
          }
        }
        
        finalData[field.id] = values;
      } else if (field.type === 'FILE') {
        const items = formData.getAll(field.id);
        
        const config = typeof field.validation === 'string' ? JSON.parse(field.validation || '{}') : (field.validation || {});
        const maxFiles = config.maxFiles || 1;
        
        const uploadedUrls: string[] = [];
        let hasFiles = false;

        for (const item of items) {
          if (typeof item === 'string') {
            if (item.trim() !== '') {
              uploadedUrls.push(item);
              hasFiles = true;
            }
          } else if (item instanceof File) {
            if (item.size > 0) {
              hasFiles = true;
              // Validate constraints
              if (config.maxSizeMb && (item.size / (1024 * 1024)) > config.maxSizeMb) {
                return { success: false, error: `File "${item.name}" exceeds the maximum size of ${config.maxSizeMb}MB.` };
              }
              if (config.allowedFileTypes && config.allowedFileTypes.length > 0) {
                const ext = "." + item.name.split('.').pop()?.toLowerCase();
                if (!config.allowedFileTypes.includes(ext)) {
                  return { success: false, error: `File type ${ext} is not allowed for "${field.label}".` };
                }
              }
              // Upload to Cloudflare R2
              const arrayBuffer = await item.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const key = await getUniqueKey(`form-submission/${formSlug}/${item.name}`);
              const url = await uploadFile(key, buffer, item.type || 'application/octet-stream');
              uploadedUrls.push(url);
            }
          }
        }

        if (isRequired && !hasFiles) {
          return { success: false, error: `Field "${field.label}" is required.` };
        }
        
        if (uploadedUrls.length > maxFiles) {
          return { success: false, error: `You can upload a maximum of ${maxFiles} files for "${field.label}".` };
        }
        
        if (uploadedUrls.length > 0) {
          finalData[field.id] = maxFiles === 1 ? uploadedUrls[0] : uploadedUrls;
        } else {
          finalData[field.id] = null;
        }
      } else {
        const value = formData.get(field.id) as string;
        if (isRequired && (!value || value.trim() === '')) {
          return { success: false, error: `Field "${field.label}" is required.` };
        }
        finalData[field.id] = value || null;
      }
    }

    // Retrieve built-in system email
    const rawEmail = formData.get('__system_email') as string;
    const systemEmail = rawEmail ? rawEmail.trim() : '';
    if (!systemEmail) {
      return { success: false, error: "Email Address is required." };
    }

    const form = formRes.rows[0];

    if (form.limitOnePerEmail) {
      const existingRes = await pool.query(
        'SELECT id FROM "formSubmission" WHERE "formId" = $1 AND LOWER("submitterEmail") = LOWER($2) LIMIT 1',
        [formId, systemEmail]
      );
      if (existingRes.rowCount !== null && existingRes.rowCount > 0) {
        return { success: false, error: "You have already submitted a response using this email address." };
      }
    }

    // Save submission
    await pool.query(
      'INSERT INTO "formSubmission" (id, "formId", "submitterEmail", data, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, now(), now())',
      [formId, systemEmail, JSON.stringify(finalData)]
    );
    
    return { success: true };
  } catch (err: any) {
    console.error("submitPublicForm error:", err);
    return { 
      success: false, 
      error: err?.message || "An unexpected error occurred while saving your submission. Please try again." 
    };
  }
}
