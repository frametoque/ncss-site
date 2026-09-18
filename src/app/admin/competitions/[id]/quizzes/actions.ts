"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getQuizCategories(competitionId: string) {
  const res = await pool.query('SELECT * FROM quiz_category WHERE "competitionId" = $1 ORDER BY name', [competitionId]);
  return res.rows;
}

export async function createQuizCategory(competitionId: string, name: string, totalTime: number | null) {
  await pool.query('INSERT INTO quiz_category ("competitionId", name, "totalTime") VALUES ($1, $2, $3)', [competitionId, name, totalTime]);
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
  const res = await pool.query('SELECT * FROM school_access WHERE "competitionId" = $1', [competitionId]);
  return res.rows;
}

export async function saveSchoolAccesses(competitionId: string, accesses: any[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const aIds = accesses.map(a => a.id).filter(Boolean);
    if (aIds.length > 0) {
      await client.query(`DELETE FROM school_access WHERE "competitionId" = $1 AND id != ALL($2::text[])`, [competitionId, aIds]);
    } else {
      await client.query(`DELETE FROM school_access WHERE "competitionId" = $1`, [competitionId]);
    }

    for (const a of accesses) {
      if (a.id) {
        await client.query(
          'UPDATE school_access SET "schoolName" = $1, "accessCode" = $2 WHERE id = $3',
          [a.schoolName, a.accessCode, a.id]
        );
      } else {
        await client.query(
          'INSERT INTO school_access (id, "competitionId", "schoolName", "accessCode") VALUES (gen_random_uuid()::text, $1, $2, $3)',
          [competitionId, a.schoolName, a.accessCode]
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
