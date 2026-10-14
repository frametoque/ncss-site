"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getQuizCategories(competitionId: string) {
  const res = await pool.query('SELECT * FROM quiz_category WHERE "competitionId" = $1 ORDER BY name', [competitionId]);
  return res.rows;
}

export async function createQuizCategory(competitionId: string, name: string, totalTime: number | null, questionTimer: number | null = 60) {
  await pool.query(
    'INSERT INTO quiz_category ("competitionId", name, "totalTime", "questionTimer") VALUES ($1, $2, $3, $4)', 
    [competitionId, name, totalTime, questionTimer]
  );
  revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
}

export async function getQuizCategory(categoryId: string) {
  const res = await pool.query('SELECT * FROM quiz_category WHERE id = $1', [categoryId]);
  return res.rows[0];
}

export async function updateQuizCategory(categoryId: string, name: string, totalTime: number | null, questionTimer: number | null = null) {
  await pool.query(
    'UPDATE quiz_category SET name = $1, "totalTime" = $2, "questionTimer" = $3 WHERE id = $4',
    [name, totalTime, questionTimer, categoryId]
  );
  revalidatePath(`/admin/competitions/[id]/quizzes/${categoryId}`, "layout");
}

export async function deleteQuizCategory(competitionId: string, categoryId: string) {
  await pool.query('DELETE FROM school_access WHERE "categoryId" = $1', [categoryId]);
  await pool.query('DELETE FROM quiz_category WHERE id = $1', [categoryId]);
  revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
}

export async function getQuizQuestions(categoryId: string) {
  const res = await pool.query('SELECT * FROM quiz_question WHERE "categoryId" = $1', [categoryId]);
  return res.rows;
}

export async function saveQuizQuestions(categoryId: string, questions: any[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const qIds = questions.map(q => q.id).filter(Boolean);
    if (qIds.length > 0) {
      await client.query(`DELETE FROM quiz_question WHERE "categoryId" = $1 AND id != ALL($2::text[])`, [categoryId, qIds]);
    } else {
      await client.query(`DELETE FROM quiz_question WHERE "categoryId" = $1`, [categoryId]);
    }

    for (const q of questions) {
      if (q.id) {
        await client.query(
          'UPDATE quiz_question SET "questionText" = $1, image = $2, options = $3, "correctOption" = $4 WHERE id = $5',
          [q.questionText, q.image || null, JSON.stringify(q.options), q.correctOption, q.id]
        );
      } else {
        await client.query(
          'INSERT INTO quiz_question (id, "categoryId", "questionText", image, options, "correctOption") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)',
          [categoryId, q.questionText, q.image || null, JSON.stringify(q.options), q.correctOption]
        );
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getSchoolAccesses(competitionId: string) {
  const res = await pool.query('SELECT * FROM school_access WHERE "competitionId" = $1 ORDER BY "schoolName" ASC', [competitionId]);
  return res.rows;
}

export async function getSchoolAccessesByCategory(categoryId: string) {
  const res = await pool.query('SELECT * FROM school_access WHERE "categoryId" = $1 ORDER BY "schoolName" ASC', [categoryId]);
  return res.rows;
}

export async function saveSchoolAccesses(competitionId: string, accesses: any[], categoryId?: string | null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (categoryId) {
      // Scoped to a specific subject / category
      const aIds = accesses.map(a => a.id).filter(Boolean);
      if (aIds.length > 0) {
        await client.query(
          `DELETE FROM school_access WHERE "competitionId" = $1 AND "categoryId" = $2 AND id != ALL($3::text[])`,
          [competitionId, categoryId, aIds]
        );
      } else {
        await client.query(
          `DELETE FROM school_access WHERE "competitionId" = $1 AND "categoryId" = $2`,
          [competitionId, categoryId]
        );
      }

      for (const a of accesses) {
        const sName = a.schoolName?.trim();
        const code = a.accessCode?.trim().toUpperCase();
        if (!sName || !code) continue;

        if (a.id) {
          await client.query(
            'UPDATE school_access SET "schoolName" = $1, "accessCode" = $2, "categoryId" = $3 WHERE id = $4',
            [sName, code, categoryId, a.id]
          );
        } else {
          await client.query(
            'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
            [competitionId, categoryId, sName, code]
          );
        }
      }
    } else {
      // Saving across multiple / all categories
      const aIds = accesses.map(a => a.id).filter(Boolean);
      if (aIds.length > 0) {
        await client.query(
          `DELETE FROM school_access WHERE "competitionId" = $1 AND id != ALL($2::text[])`,
          [competitionId, aIds]
        );
      } else {
        await client.query(
          `DELETE FROM school_access WHERE "competitionId" = $1`,
          [competitionId]
        );
      }

      for (const a of accesses) {
        const sName = a.schoolName?.trim();
        const code = a.accessCode?.trim().toUpperCase();
        const catId = a.categoryId || null;
        if (!sName || !code) continue;

        if (a.id) {
          await client.query(
            'UPDATE school_access SET "schoolName" = $1, "accessCode" = $2, "categoryId" = $3 WHERE id = $4',
            [sName, code, catId, a.id]
          );
        } else {
          await client.query(
            'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
            [competitionId, catId, sName, code]
          );
        }
      }
    }

    await client.query("COMMIT");
    revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteSchoolFromAllCategories(competitionId: string, schoolName: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch school_access IDs for this school in this competition
    const saRes = await client.query(
      'SELECT id FROM school_access WHERE "competitionId" = $1 AND LOWER(TRIM("schoolName")) = LOWER(TRIM($2))',
      [competitionId, schoolName]
    );
    const saIds = saRes.rows.map(r => r.id);

    if (saIds.length > 0) {
      await client.query(
        'DELETE FROM quiz_submission WHERE "schoolAccessId" = ANY($1::text[])',
        [saIds]
      );
      await client.query(
        'DELETE FROM school_access WHERE id = ANY($1::text[])',
        [saIds]
      );
    }

    await client.query("COMMIT");
    revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
    return { success: true };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getQuizSubmissions(categoryId: string) {
  const res = await pool.query(`
    SELECT qs.*, sa."schoolName" 
    FROM quiz_submission qs 
    JOIN school_access sa ON qs."schoolAccessId" = sa.id 
    WHERE qs."categoryId" = $1
    ORDER BY qs."createdAt" DESC
  `, [categoryId]);
  return res.rows;
}

export async function importSchoolsFromForm(competitionId: string, formId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catsRes = await client.query('SELECT id FROM quiz_category WHERE "competitionId" = $1', [competitionId]);
    const categories = catsRes.rows;
    if (categories.length === 0) {
      throw new Error("No subjects/categories found for this competition.");
    }

    const existingRes = await client.query('SELECT "accessCode", "schoolName", "categoryId" FROM school_access WHERE "competitionId" = $1', [competitionId]);
    const existingCodes = new Set<string>(existingRes.rows.map(r => r.accessCode));
    const existingPairs = new Set<string>(existingRes.rows.map(r => `${r.schoolName.trim().toLowerCase()}_${r.categoryId}`));

    const subsRes = await client.query('SELECT data FROM "formSubmission" WHERE "formId" = $1 ORDER BY "createdAt" ASC', [formId]);

    const seenSchools = new Set<string>();
    const schoolsToImport: string[] = [];

    for (const r of subsRes.rows) {
      const d = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      let name = (d["new_wk9w25l"] || "").trim();
      if (!name) continue;

      if (name.toLowerCase().includes("tharul") || name.toLowerCase().includes("senuda perera")) {
        continue;
      }
      if (name.toLowerCase().includes("anula vidyalaya")) {
        name = "Anula Vidyalaya";
      }

      if (!seenSchools.has(name.toLowerCase())) {
        seenSchools.add(name.toLowerCase());
        schoolsToImport.push(name);
      }
    }

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const getCode = () => {
      while (true) {
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (!existingCodes.has(code)) {
          existingCodes.add(code);
          return code;
        }
      }
    };

    let importedCount = 0;
    for (const school of schoolsToImport) {
      for (const cat of categories) {
        const pairKey = `${school.toLowerCase()}_${cat.id}`;
        if (!existingPairs.has(pairKey)) {
          const code = getCode();
          await client.query(
            'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
            [competitionId, cat.id, school, code]
          );
          existingPairs.add(pairKey);
          importedCount++;
        }
      }
    }

    await client.query("COMMIT");
    revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
    return { success: true, count: importedCount };
  } catch (err: any) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface RegisteredSchoolCandidate {
  schoolName: string;
  district?: string;
  submitterEmail?: string;
  createdAt?: string;
  isAlreadyAdded: boolean;
}

export async function getFormSchoolCandidates(competitionId: string, formId: string): Promise<RegisteredSchoolCandidate[]> {
  const fieldsRes = await pool.query(
    'SELECT id, label FROM "formField" WHERE "formId" = $1 ORDER BY "orderIndex" ASC',
    [formId]
  );
  
  let schoolFieldId = null;
  let districtFieldId = null;
  for (const f of fieldsRes.rows) {
    const l = (f.label || "").toLowerCase();
    if (!schoolFieldId && (l.includes("school") || l.includes("institution") || l.includes("college"))) {
      schoolFieldId = f.id;
    }
    if (!districtFieldId && l.includes("district")) {
      districtFieldId = f.id;
    }
  }
  if (!schoolFieldId) schoolFieldId = "new_wk9w25l";
  if (!districtFieldId) districtFieldId = "new_2bgxnwh";

  const accessRes = await pool.query(
    'SELECT DISTINCT LOWER(TRIM("schoolName")) as name FROM school_access WHERE "competitionId" = $1',
    [competitionId]
  );
  const existingSet = new Set(accessRes.rows.map(r => r.name));

  const subsRes = await pool.query(
    'SELECT id, "submitterEmail", "createdAt", data FROM "formSubmission" WHERE "formId" = $1 ORDER BY "createdAt" ASC',
    [formId]
  );

  const seen = new Set<string>();
  const candidates: RegisteredSchoolCandidate[] = [];

  for (const r of subsRes.rows) {
    const d = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
    let name = (d[schoolFieldId] || "").trim();
    if (!name) continue;

    if (name.toLowerCase().includes("tharul") || name.toLowerCase().includes("senuda perera")) {
      continue;
    }
    if (name.toLowerCase().includes("anula vidyalaya")) {
      name = "Anula Vidyalaya";
    }

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const isAlreadyAdded = existingSet.has(key);
    candidates.push({
      schoolName: name,
      district: (d[districtFieldId] || "").trim(),
      submitterEmail: r.submitterEmail || "",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      isAlreadyAdded
    });
  }

  return candidates;
}

export async function importSelectedSchools(competitionId: string, schoolNames: string[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catsRes = await client.query('SELECT id FROM quiz_category WHERE "competitionId" = $1', [competitionId]);
    const categories = catsRes.rows;
    if (categories.length === 0) {
      throw new Error("No subjects/categories found for this competition.");
    }

    const existingRes = await client.query('SELECT "accessCode", "schoolName", "categoryId" FROM school_access WHERE "competitionId" = $1', [competitionId]);
    const existingCodes = new Set<string>(existingRes.rows.map(r => r.accessCode?.trim().toUpperCase()).filter(Boolean));
    const existingPairs = new Set<string>(existingRes.rows.map(r => `${r.schoolName.trim().toLowerCase()}_${r.categoryId}`));

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const getCode = () => {
      while (true) {
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (!existingCodes.has(code)) {
          existingCodes.add(code);
          return code;
        }
      }
    };

    let importedCount = 0;
    for (const school of schoolNames) {
      const trimmed = school.trim();
      if (!trimmed) continue;
      for (const cat of categories) {
        const pairKey = `${trimmed.toLowerCase()}_${cat.id}`;
        if (!existingPairs.has(pairKey)) {
          const code = getCode();
          await client.query(
            'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
            [competitionId, cat.id, trimmed, code]
          );
          existingPairs.add(pairKey);
          importedCount++;
        }
      }
    }

    await client.query("COMMIT");
    revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
    return { success: true, count: importedCount };
  } catch (err: any) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
