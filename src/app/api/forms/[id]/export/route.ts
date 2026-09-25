import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const formRes = await pool.query('SELECT * FROM "form" WHERE id = $1', [id]);
  if (formRes.rowCount === 0) return new NextResponse("Form not found", { status: 404 });
  
  const form = formRes.rows[0];
  
  const fieldsRes = await pool.query('SELECT * FROM "formField" WHERE "formId" = $1 ORDER BY "orderIndex" ASC', [id]);
  const rawFields = fieldsRes.rows;
  
  let currentSection = "";
  const fields = [];
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
  const headerRow = ["Date", "Submitter Email", ...fields.map(f => `"${f.displayLabel.replace(/"/g, '""')}"`)];
  const rows = [headerRow.join(",")];

  for (const sub of submissions) {
    const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
    const row = [
      `"${new Date(sub.createdAt).toISOString()}"`,
      `"${String(sub.submitterEmail || '').replace(/"/g, '""')}"`,
      ...fields.map(f => {
        let val = data[f.id] || '';
        if (Array.isArray(val)) val = val.join(', ');
        return `"${String(val).replace(/"/g, '""')}"`;
      })
    ];
    rows.push(row.join(","));
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${form.slug}-submissions.csv"`
    }
  });
}
