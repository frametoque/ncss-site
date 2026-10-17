import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { rewriteDataUrls } from '@/lib/storage';
import { getSession } from '@/lib/auth';

export const dynamic = "force-dynamic";

/**
 * Escapes CSV values and neutralizes CSV Formula Injection (CWE-1236).
 * Prepend a single quote if the field starts with =, +, -, @, \t, or \r.
 */
function sanitizeCsvCell(value: any): string {
  let str = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1', [id]);
  if (formRes.rowCount === 0) return new NextResponse("Form not found", { status: 404 });
  
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
  const submissions = subRes.rows;

  // Build CSV
  const headerRow = ["Date", "Submitter Email", ...fields.map(f => sanitizeCsvCell(f.displayLabel))];
  const rows = [headerRow.join(",")];

  for (const sub of submissions) {
    const rawData = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
    const data = rewriteDataUrls(rawData);
    const row = [
      sanitizeCsvCell(new Date(sub.createdAt).toISOString()),
      sanitizeCsvCell(sub.submitterEmail || ''),
      ...fields.map(f => {
        let val = data[f.id] || '';
        if (Array.isArray(val)) val = val.join(', ');
        return sanitizeCsvCell(val);
      })
    ];
    rows.push(row.join(","));
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${form.slug}-submissions.csv"`,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
