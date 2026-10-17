"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { groupCategoriesBySubject, parseCategorySubject, getSubjectName } from "@/lib/quizSubjects";

export async function getQuizCategories(competitionId: string) {
  const res = await pool.query('SELECT * FROM quiz_category WHERE "competitionId" = $1 ORDER BY name', [competitionId]);
  return res.rows;
}

export async function createQuizCategory(competitionId: string, name: string, totalTime: number | null, questionTimer: number | null = 60) {
  const insertRes = await pool.query(
    'INSERT INTO quiz_category ("competitionId", name, "totalTime", "questionTimer") VALUES ($1, $2, $3, $4) RETURNING id', 
    [competitionId, name.trim(), totalTime, questionTimer]
  );
  const newCatId = insertRes.rows[0]?.id;

  // If other categories already exist for the same subject, copy over their school access codes
  const subjectName = getSubjectName(name.trim());
  if (newCatId && subjectName) {
    const siblingCatsRes = await pool.query(
      'SELECT id, name FROM quiz_category WHERE "competitionId" = $1 AND id != $2',
      [competitionId, newCatId]
    );
    const siblingCatIds = siblingCatsRes.rows
      .filter(c => getSubjectName(c.name).toLowerCase() === subjectName.toLowerCase())
      .map(c => c.id);

    if (siblingCatIds.length > 0) {
      const siblingAccessRes = await pool.query(
        'SELECT DISTINCT ON (LOWER(TRIM("schoolName"))) "schoolName", "accessCode" FROM school_access WHERE "categoryId" = ANY($1::text[])',
        [siblingCatIds]
      );
      for (const row of siblingAccessRes.rows) {
        if (row.schoolName && row.accessCode) {
          await pool.query(
            'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
            [competitionId, newCatId, row.schoolName, row.accessCode]
          );
        }
      }
    }
  }

  revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
  return { success: true, id: newCatId };
}

export async function addMediumToSubject(competitionId: string, subjectName: string, mediumName: string, questionTimer: number = 60) {
  const fullName = `${subjectName.trim()} - ${mediumName.trim()}`;
  return await createQuizCategory(competitionId, fullName, null, questionTimer);
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('DELETE FROM quiz_submission WHERE "categoryId" = $1', [categoryId]);
    await client.query('DELETE FROM quiz_question WHERE "categoryId" = $1', [categoryId]);
    await client.query('DELETE FROM school_access WHERE "categoryId" = $1', [categoryId]);
    await client.query('DELETE FROM quiz_category WHERE id = $1', [categoryId]);
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

export async function deleteSubject(competitionId: string, categoryIds: string[]) {
  if (!categoryIds || categoryIds.length === 0) return { success: true };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('DELETE FROM quiz_submission WHERE "categoryId" = ANY($1::text[])', [categoryIds]);
    await client.query('DELETE FROM quiz_question WHERE "categoryId" = ANY($1::text[])', [categoryIds]);
    await client.query('DELETE FROM school_access WHERE "categoryId" = ANY($1::text[])', [categoryIds]);
    await client.query('DELETE FROM quiz_category WHERE id = ANY($1::text[])', [categoryIds]);
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

export async function getQuizQuestions(categoryId: string) {
  // Ensure table has the latest columns
  await pool.query(`
    ALTER TABLE quiz_question 
    ADD COLUMN IF NOT EXISTS code text, 
    ADD COLUMN IF NOT EXISTS "codeLanguage" text,
    ADD COLUMN IF NOT EXISTS "orderIndex" integer
  `).catch(() => {});

  const res = await pool.query('SELECT * FROM quiz_question WHERE "categoryId" = $1 ORDER BY "orderIndex" ASC NULLS LAST, id ASC', [categoryId]);
  return res.rows;
}

export async function saveQuizQuestions(categoryId: string, questions: any[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE quiz_question 
      ADD COLUMN IF NOT EXISTS code text, 
      ADD COLUMN IF NOT EXISTS "codeLanguage" text,
      ADD COLUMN IF NOT EXISTS "orderIndex" integer
    `).catch(() => {});
    
    const qIds = questions.map(q => q.id).filter(Boolean);
    if (qIds.length > 0) {
      await client.query(`DELETE FROM quiz_question WHERE "categoryId" = $1 AND id != ALL($2::text[])`, [categoryId, qIds]);
    } else {
      await client.query(`DELETE FROM quiz_question WHERE "categoryId" = $1`, [categoryId]);
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const codeVal = q.code && q.code.trim() ? q.code.trim() : null;
      const codeLangVal = codeVal ? (q.codeLanguage || "plaintext") : null;
      if (q.id) {
        await client.query(
          'UPDATE quiz_question SET "questionText" = $1, image = $2, options = $3, "correctOption" = $4, code = $5, "codeLanguage" = $6, "orderIndex" = $7 WHERE id = $8',
          [q.questionText, q.image || null, JSON.stringify(q.options), q.correctOption, codeVal, codeLangVal, i, q.id]
        );
      } else {
        await client.query(
          'INSERT INTO quiz_question (id, "categoryId", "questionText", image, options, "correctOption", code, "codeLanguage", "orderIndex") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8)',
          [categoryId, q.questionText, q.image || null, JSON.stringify(q.options), q.correctOption, codeVal, codeLangVal, i]
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

    // Fetch all categories for this competition to understand subject groupings
    const catsRes = await client.query('SELECT id, name FROM quiz_category WHERE "competitionId" = $1', [competitionId]);
    const allCategories = catsRes.rows;
    const subjectGroups = groupCategoriesBySubject(allCategories);

    if (categoryId) {
      // Scoped to a specific subject / category (or its subject group)
      const targetGroup = subjectGroups.find(g => g.categoryIds.includes(categoryId));
      const targetCatIds = targetGroup ? targetGroup.categoryIds : [categoryId];

      // Build map of schoolName -> accessCode from accesses
      const schoolCodeMap = new Map<string, string>();
      for (const a of accesses) {
        const sName = a.schoolName?.trim();
        const code = a.accessCode?.trim().toUpperCase();
        if (sName && code) {
          schoolCodeMap.set(sName.toLowerCase(), code);
        }
      }

      // Delete removed accesses for these categories
      const activeSchoolNames = Array.from(schoolCodeMap.keys());
      if (activeSchoolNames.length > 0) {
        await client.query(
          `DELETE FROM school_access 
           WHERE "competitionId" = $1 
             AND "categoryId" = ANY($2::text[])
             AND LOWER(TRIM("schoolName")) != ALL($3::text[])`,
          [competitionId, targetCatIds, activeSchoolNames]
        );
      } else {
        await client.query(
          `DELETE FROM school_access 
           WHERE "competitionId" = $1 AND "categoryId" = ANY($2::text[])`,
          [competitionId, targetCatIds]
        );
      }

      // Upsert for every school and every category in this subject group (so both mediums have the same code)
      for (const [lowerName, code] of schoolCodeMap.entries()) {
        // Find proper casing
        const orig = accesses.find(a => a.schoolName?.trim().toLowerCase() === lowerName);
        const displayName = orig ? orig.schoolName.trim() : lowerName;

        for (const catId of targetCatIds) {
          const existingRes = await client.query(
            `SELECT id FROM school_access 
             WHERE "competitionId" = $1 AND "categoryId" = $2 AND LOWER(TRIM("schoolName")) = $3`,
            [competitionId, catId, lowerName]
          );

          if (existingRes.rows.length > 0) {
            await client.query(
              'UPDATE school_access SET "schoolName" = $1, "accessCode" = $2 WHERE id = $3',
              [displayName, code, existingRes.rows[0].id]
            );
          } else {
            await client.query(
              'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
              [competitionId, catId, displayName, code]
            );
          }
        }
      }
    } else {
      // Saving across multiple / all categories
      // Ensure all mediums of the same subject for each school have the same code
      // Map: schoolName_subject -> accessCode
      const subjectCodeMap = new Map<string, string>();
      for (const a of accesses) {
        const sName = a.schoolName?.trim();
        const code = a.accessCode?.trim().toUpperCase();
        const catId = a.categoryId;
        if (!sName || !code) continue;

        const cat = allCategories.find(c => c.id === catId);
        const subject = cat ? getSubjectName(cat.name).toLowerCase() : "default";
        const key = `${sName.toLowerCase()}___${subject}`;
        if (!subjectCodeMap.has(key)) {
          subjectCodeMap.set(key, code);
        }
      }

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
        let code = a.accessCode?.trim().toUpperCase();
        const catId = a.categoryId || null;
        if (!sName || !code) continue;

        const cat = allCategories.find(c => c.id === catId);
        const subject = cat ? getSubjectName(cat.name).toLowerCase() : "default";
        const key = `${sName.toLowerCase()}___${subject}`;
        if (subjectCodeMap.has(key)) {
          code = subjectCodeMap.get(key)!;
        }

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

    const catsRes = await client.query('SELECT id, name FROM quiz_category WHERE "competitionId" = $1', [competitionId]);
    const categories = catsRes.rows;
    if (categories.length === 0) {
      throw new Error("No subjects/categories found for this competition.");
    }
    const subjectGroups = groupCategoriesBySubject(categories);

    const existingRes = await client.query(
      'SELECT sa."id", sa."accessCode", sa."schoolName", sa."categoryId", qc.name as "categoryName" FROM school_access sa LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id WHERE sa."competitionId" = $1',
      [competitionId]
    );
    const existingCodes = new Set<string>(existingRes.rows.map(r => r.accessCode?.trim().toUpperCase()).filter(Boolean));
    const existingPairs = new Set<string>(existingRes.rows.map(r => `${r.schoolName.trim().toLowerCase()}_${r.categoryId}`));

    // Map: school_lower + "___" + subject_lower -> code
    const existingSchoolSubjectCodes = new Map<string, string>();
    for (const r of existingRes.rows) {
      const sName = r.schoolName?.trim().toLowerCase();
      const code = r.accessCode?.trim().toUpperCase();
      const subject = r.categoryName ? getSubjectName(r.categoryName).toLowerCase() : "";
      if (sName && code && subject && !existingSchoolSubjectCodes.has(`${sName}___${subject}`)) {
        existingSchoolSubjectCodes.set(`${sName}___${subject}`, code);
      }
    }

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
      const schoolLower = school.trim().toLowerCase();
      for (const grp of subjectGroups) {
        const subKey = `${schoolLower}___${grp.subject.toLowerCase()}`;
        let subjectCode = existingSchoolSubjectCodes.get(subKey);
        if (!subjectCode) {
          subjectCode = getCode();
          existingSchoolSubjectCodes.set(subKey, subjectCode);
        }

        for (const cat of grp.categories) {
          const pairKey = `${schoolLower}_${cat.id}`;
          if (!existingPairs.has(pairKey)) {
            await client.query(
              'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
              [competitionId, cat.id, school, subjectCode]
            );
            existingPairs.add(pairKey);
            importedCount++;
          }
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

    const catsRes = await client.query('SELECT id, name FROM quiz_category WHERE "competitionId" = $1', [competitionId]);
    const categories = catsRes.rows;
    if (categories.length === 0) {
      throw new Error("No subjects/categories found for this competition.");
    }
    const subjectGroups = groupCategoriesBySubject(categories);

    const existingRes = await client.query(
      'SELECT sa."id", sa."accessCode", sa."schoolName", sa."categoryId", qc.name as "categoryName" FROM school_access sa LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id WHERE sa."competitionId" = $1',
      [competitionId]
    );
    const existingCodes = new Set<string>(existingRes.rows.map(r => r.accessCode?.trim().toUpperCase()).filter(Boolean));
    const existingPairs = new Set<string>(existingRes.rows.map(r => `${r.schoolName.trim().toLowerCase()}_${r.categoryId}`));

    // Map: school_lower + "___" + subject_lower -> code
    const existingSchoolSubjectCodes = new Map<string, string>();
    for (const r of existingRes.rows) {
      const sName = r.schoolName?.trim().toLowerCase();
      const code = r.accessCode?.trim().toUpperCase();
      const subject = r.categoryName ? getSubjectName(r.categoryName).toLowerCase() : "";
      if (sName && code && subject && !existingSchoolSubjectCodes.has(`${sName}___${subject}`)) {
        existingSchoolSubjectCodes.set(`${sName}___${subject}`, code);
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
    for (const school of schoolNames) {
      const trimmed = school.trim();
      if (!trimmed) continue;
      const schoolLower = trimmed.toLowerCase();

      for (const grp of subjectGroups) {
        const subKey = `${schoolLower}___${grp.subject.toLowerCase()}`;
        let subjectCode = existingSchoolSubjectCodes.get(subKey);
        if (!subjectCode) {
          subjectCode = getCode();
          existingSchoolSubjectCodes.set(subKey, subjectCode);
        }

        for (const cat of grp.categories) {
          const pairKey = `${schoolLower}_${cat.id}`;
          if (!existingPairs.has(pairKey)) {
            await client.query(
              'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
              [competitionId, cat.id, trimmed, subjectCode]
            );
            existingPairs.add(pairKey);
            importedCount++;
          }
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

/**
 * Unifies access codes for each school by subject.
 * Guarantees that every medium of a subject has the same access code for that school,
 * while ensuring distinct subjects still have distinct codes.
 */
export async function unifySchoolAccessCodesBySubject(competitionId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catsRes = await client.query('SELECT id, name FROM quiz_category WHERE "competitionId" = $1', [competitionId]);
    const categories = catsRes.rows;
    if (categories.length === 0) {
      await client.query("ROLLBACK");
      return { success: true, count: 0 };
    }
    const subjectGroups = groupCategoriesBySubject(categories);

    const accessRes = await client.query(
      'SELECT sa.*, qc.name as "categoryName" FROM school_access sa LEFT JOIN quiz_category qc ON sa."categoryId" = qc.id WHERE sa."competitionId" = $1',
      [competitionId]
    );

    const allUsedCodes = new Set<string>();
    for (const r of accessRes.rows) {
      const c = r.accessCode?.trim().toUpperCase();
      if (c) allUsedCodes.add(c);
    }

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const getCode = () => {
      while (true) {
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (!allUsedCodes.has(code)) {
          allUsedCodes.add(code);
          return code;
        }
      }
    };

    // Group existing accesses by schoolName and subject
    // Key: schoolLower -> Map of subjectLower -> array of rows
    const schoolMap = new Map<string, { displayName: string; subjects: Map<string, any[]> }>();

    for (const r of accessRes.rows) {
      const sName = r.schoolName?.trim();
      if (!sName) continue;
      const sLower = sName.toLowerCase();
      if (!schoolMap.has(sLower)) {
        schoolMap.set(sLower, { displayName: sName, subjects: new Map() });
      }
      const schoolObj = schoolMap.get(sLower)!;
      const subName = r.categoryName ? getSubjectName(r.categoryName) : "default";
      const subKey = subName.toLowerCase();
      if (!schoolObj.subjects.has(subKey)) {
        schoolObj.subjects.set(subKey, []);
      }
      schoolObj.subjects.get(subKey)!.push(r);
    }

    let updatedCount = 0;

    for (const [schoolLower, schoolObj] of schoolMap.entries()) {
      for (const grp of subjectGroups) {
        const subKey = grp.subject.toLowerCase();
        const existingRows = schoolObj.subjects.get(subKey) || [];

        // Pick the first existing valid code, or generate a new one
        let chosenCode = existingRows.find(r => r.accessCode?.trim())?.accessCode?.trim().toUpperCase();
        if (!chosenCode) {
          chosenCode = getCode();
        }

        // 1. Update existing rows for this subject
        for (const row of existingRows) {
          if (row.accessCode?.trim().toUpperCase() !== chosenCode) {
            await client.query(
              'UPDATE school_access SET "accessCode" = $1 WHERE id = $2',
              [chosenCode, row.id]
            );
            updatedCount++;
          }
        }

        // 2. If any category in this subject is missing for this school, insert it with the same code
        const existingCatIds = new Set(existingRows.map(r => r.categoryId));
        for (const cat of grp.categories) {
          if (!existingCatIds.has(cat.id)) {
            await client.query(
              'INSERT INTO school_access (id, "competitionId", "categoryId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
              [competitionId, cat.id, schoolObj.displayName, chosenCode]
            );
            updatedCount++;
          }
        }
      }
    }

    await client.query("COMMIT");
    revalidatePath(`/admin/competitions/${competitionId}/quizzes`);
    return { success: true, count: updatedCount };
  } catch (err: any) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getSubjectQuizSubmissionsForPdf(categoryIds: string[]) {
  if (!categoryIds || categoryIds.length === 0) return [];
  const [subsRes, questionsRes] = await Promise.all([
    pool.query(`
      SELECT qs.id, qs."categoryId", qs.score, qs."totalTimeLeft", qs."createdAt", 
             sa."schoolName", qc.name as "categoryName"
      FROM quiz_submission qs
      JOIN school_access sa ON qs."schoolAccessId" = sa.id
      JOIN quiz_category qc ON qs."categoryId" = qc.id
      WHERE qs."categoryId" = ANY($1::text[])
      ORDER BY qs.score DESC, qs."totalTimeLeft" DESC, qs."createdAt" ASC
    `, [categoryIds]),
    pool.query(
      'SELECT "categoryId", count(*)::int as count FROM quiz_question WHERE "categoryId" = ANY($1::text[]) GROUP BY "categoryId"',
      [categoryIds]
    )
  ]);

  const qCountMap: Record<string, number> = {};
  for (const q of questionsRes.rows) {
    qCountMap[q.categoryId] = q.count;
  }

  return subsRes.rows.map(sub => {
    const parsed = parseCategorySubject(sub.categoryName);
    return {
      schoolName: sub.schoolName,
      medium: parsed.medium || sub.categoryName,
      score: sub.score,
      totalQuestions: qCountMap[sub.categoryId] || 0,
      totalTimeLeft: sub.totalTimeLeft || 0,
      createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString()
    };
  });
}


