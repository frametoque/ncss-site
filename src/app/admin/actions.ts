"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile, deleteFile } from "@/lib/storage";

async function deleteOldBlob(url: string | null | undefined) {
  if (!url) return;
  try {
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '');
    if (publicUrl && url.startsWith(publicUrl)) {
      const key = url.replace(`${publicUrl}/`, '');
      await deleteFile(key);
    }
  } catch (e) {
    console.error('Failed to delete file from R2', url, e);
  }
}

async function handleFileUpload(file: any): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return typeof file === "string" && file ? file : null;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${Date.now()}-${safeName}`;
  return await uploadFile(key, buffer, file.type || 'application/octet-stream');
}

// Posts
export async function createPost(data: Record<string, any>) {
  const coverImage = await handleFileUpload(data.coverImage);
  
  // Calculate reading time automatically
  const plainText = (data.content || "").replace(/<[^>]*>?/gm, '');
  const wordCount = plainText.split(/\s+/).filter((word: string) => word.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  await pool.query(
    'INSERT INTO "post" (id, slug, title, category, "coverImage", content, excerpt, author, "readingTime", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, now(), now())',
    [data.slug, data.title, data.category, coverImage, data.content, data.excerpt || null, data.author, readingTime]
  );
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");
}

export async function updatePost(id: string, data: Record<string, any>) {
  const oldRes = await pool.query('SELECT "coverImage" FROM "post" WHERE id = $1', [id]);
  // If coverImage is a string or empty, handleFileUpload returns it or null. 
  // Wait, if it's not provided, we should probably fetch existing and keep it, but the form will pass the existing string if unchanged.
  const coverImage = await handleFileUpload(data.coverImage);
  if (coverImage && oldRes.rows[0] && coverImage !== oldRes.rows[0].coverImage) await deleteOldBlob(oldRes.rows[0].coverImage);
  
  // Calculate reading time automatically
  const plainText = (data.content || "").replace(/<[^>]*>?/gm, '');
  const wordCount = plainText.split(/\s+/).filter((word: string) => word.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  await pool.query(
    'UPDATE "post" SET slug = $1, title = $2, category = $3, "coverImage" = COALESCE($4, "coverImage"), content = $5, excerpt = $6, author = $7, "readingTime" = $8, "updatedAt" = now() WHERE id = $9',
    [data.slug, data.title, data.category, coverImage, data.content, data.excerpt || null, data.author, readingTime, id]
  );
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");
}

export async function deletePost(id: string) {
  const oldRes = await pool.query('SELECT "coverImage" FROM "post" WHERE id = $1', [id]);
  if (oldRes.rows[0]) await deleteOldBlob(oldRes.rows[0].coverImage);
  await pool.query('DELETE FROM "post" WHERE id = $1', [id]);
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");
}

// Magazines
export async function createMagazine(data: Record<string, any>) {
  const coverThumbnail = await handleFileUpload(data.coverThumbnail);
  const outNowImage = await handleFileUpload(data.outNowImage);
  const pdfUrl = await handleFileUpload(data.pdfUrl);
  
  const vol = data.volumeNumber || 1;
  const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vol${vol}-issue${data.issueNumber}`;
  const createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();

  await pool.query(
    'INSERT INTO "magazine" (id, slug, "volumeNumber", "issueNumber", title, "coverThumbnail", "outNowImage", "pdfUrl", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, now())',
    [slug, vol, data.issueNumber, data.title, coverThumbnail, outNowImage, pdfUrl, createdAt]
  );
  revalidatePath("/admin/magazines");
  revalidatePath("/magazine");
  revalidatePath(`/magazine/${slug}`);
}

export async function updateMagazine(id: string, data: Record<string, any>) {
  const oldRes = await pool.query('SELECT "coverThumbnail", "outNowImage", "pdfUrl" FROM "magazine" WHERE id = $1', [id]);
  const coverThumbnail = await handleFileUpload(data.coverThumbnail);
  const outNowImage = await handleFileUpload(data.outNowImage);
  const pdfUrl = await handleFileUpload(data.pdfUrl);
  if (coverThumbnail && oldRes.rows[0] && coverThumbnail !== oldRes.rows[0].coverThumbnail) await deleteOldBlob(oldRes.rows[0].coverThumbnail);
  if (outNowImage && oldRes.rows[0] && outNowImage !== oldRes.rows[0].outNowImage) await deleteOldBlob(oldRes.rows[0].outNowImage);
  if (pdfUrl && oldRes.rows[0] && pdfUrl !== oldRes.rows[0].pdfUrl) await deleteOldBlob(oldRes.rows[0].pdfUrl);

  const vol = data.volumeNumber || 1;
  const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vol${vol}-issue${data.issueNumber}`;

  const query = data.createdAt
    ? 'UPDATE "magazine" SET slug = $1, "volumeNumber" = $2, "issueNumber" = $3, title = $4, "coverThumbnail" = COALESCE($5, "coverThumbnail"), "outNowImage" = COALESCE($6, "outNowImage"), "pdfUrl" = COALESCE($7, "pdfUrl"), "createdAt" = $8, "updatedAt" = now() WHERE id = $9'
    : 'UPDATE "magazine" SET slug = $1, "volumeNumber" = $2, "issueNumber" = $3, title = $4, "coverThumbnail" = COALESCE($5, "coverThumbnail"), "outNowImage" = COALESCE($6, "outNowImage"), "pdfUrl" = COALESCE($7, "pdfUrl"), "updatedAt" = now() WHERE id = $8';

  const params = data.createdAt
    ? [slug, vol, data.issueNumber, data.title, coverThumbnail, outNowImage, pdfUrl, new Date(data.createdAt).toISOString(), id]
    : [slug, vol, data.issueNumber, data.title, coverThumbnail, outNowImage, pdfUrl, id];

  await pool.query(query, params);
  revalidatePath("/admin/magazines");
  revalidatePath("/magazine");
  revalidatePath(`/magazine/${slug}`);
}

export async function deleteMagazine(id: string) {
  const oldRes = await pool.query('SELECT "coverThumbnail", "outNowImage", "pdfUrl" FROM "magazine" WHERE id = $1', [id]);
  if (oldRes.rows[0]) {
    await deleteOldBlob(oldRes.rows[0].coverThumbnail);
    await deleteOldBlob(oldRes.rows[0].outNowImage);
    await deleteOldBlob(oldRes.rows[0].pdfUrl);
  }
  await pool.query('DELETE FROM "magazine" WHERE id = $1', [id]);
  revalidatePath("/admin/magazines");
  revalidatePath("/magazine");
}

// Competitions
export async function createCompetition(data: Record<string, any>) {
  await pool.query(
    'INSERT INTO "competition" (id, slug, title, description, "isEnded", "isQuiz", date, time, location, deadline, content, "coverImage", "rulesPdf", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())',
    [data.slug, data.title, data.description, data.isEnded, data.isQuiz || false, data.date || null, data.time || null, data.location || null, data.deadline || null, data.content, data.coverImage || null, data.rulesPdf || null]
  );
  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  revalidatePath("/");
}

export async function updateCompetition(id: string, data: Record<string, any>) {
  await pool.query(
    'UPDATE "competition" SET slug = $1, title = $2, description = $3, "isEnded" = $4, "isQuiz" = $5, date = $6, time = $7, location = $8, deadline = $9, content = $10, "coverImage" = COALESCE($11, "coverImage"), "rulesPdf" = COALESCE($12, "rulesPdf"), "updatedAt" = now() WHERE id = $13',
    [data.slug, data.title, data.description, data.isEnded, data.isQuiz || false, data.date || null, data.time || null, data.location || null, data.deadline || null, data.content, data.coverImage || null, data.rulesPdf || null, id]
  );
  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  revalidatePath("/");
}

export async function deleteCompetition(id: string) {
  await pool.query('DELETE FROM "competition" WHERE id = $1', [id]);
  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  revalidatePath("/");
}

// Executive Board Members
export async function createExecutiveBoardMember(data: Record<string, any>) {
  const photoUrl = await handleFileUpload(data.photoUrl);
  await pool.query(
    'INSERT INTO "executiveBoard" (id, name, role, "photoUrl", "orderIndex", "contactNumber", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, now(), now())',
    [data.name, data.role, photoUrl, data.orderIndex || 0, data.contactNumber || null]
  );
  revalidatePath("/admin/board");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export async function updateExecutiveBoardMember(id: string, data: Record<string, any>) {
  const photoUrl = await handleFileUpload(data.photoUrl);
  await pool.query(
    'UPDATE "executiveBoard" SET name = $1, role = $2, "photoUrl" = COALESCE($3, "photoUrl"), "contactNumber" = $4, "updatedAt" = now() WHERE id = $5',
    [data.name, data.role, photoUrl, data.contactNumber || null, id]
  );
  revalidatePath("/admin/board");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export async function deleteExecutiveBoardMember(id: string) {
  await pool.query('DELETE FROM "executiveBoard" WHERE id = $1', [id]);
  revalidatePath("/admin/board");
  revalidatePath("/about");
}

export async function updateBoardOrder(orderedIds: string[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE "executiveBoard" SET "orderIndex" = $1 WHERE id = $2', [i, orderedIds[i]]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  revalidatePath("/admin/board");
  revalidatePath("/about");
}

export async function updateCompetitionsOrder(orderedIds: string[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE "competition" SET "orderIndex" = $1 WHERE id = $2', [i, orderedIds[i]]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
  revalidatePath("/");
}

// About Page Actions

// History
export async function updateHistorySection(sectionKey: string, data: Record<string, any>) {
  const photoUrl = await handleFileUpload(data.photoUrl);
  await pool.query(
    `INSERT INTO "history" (id, "sectionKey", title, content, "photoUrl")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
     ON CONFLICT ("sectionKey") DO UPDATE 
     SET title = EXCLUDED.title, content = EXCLUDED.content, "photoUrl" = COALESCE($4, "history"."photoUrl"), "updatedAt" = now()`,
    [sectionKey, data.title, data.content, photoUrl]
  );
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

// Milestones
export async function createMilestone(data: Record<string, any>) {
  await pool.query(
    'INSERT INTO "milestone" (id, year, title, description, "orderIndex") VALUES (gen_random_uuid()::text, $1, $2, $3, $4)',
    [data.year, data.title, data.description, data.orderIndex || 0]
  );
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function updateMilestone(id: string, data: Record<string, any>) {
  await pool.query(
    'UPDATE "milestone" SET year = $1, title = $2, description = $3, "updatedAt" = now() WHERE id = $4',
    [data.year, data.title, data.description, id]
  );
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function deleteMilestone(id: string) {
  await pool.query('DELETE FROM "milestone" WHERE id = $1', [id]);
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

// Annual Events
export async function createAnnualEvent(data: Record<string, any>) {
  await pool.query(
    'INSERT INTO "annualEvent" (id, title, description, "orderIndex") VALUES (gen_random_uuid()::text, $1, $2, $3)',
    [data.title, data.description, data.orderIndex || 0]
  );
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function updateAnnualEvent(id: string, data: Record<string, any>) {
  await pool.query(
    'UPDATE "annualEvent" SET title = $1, description = $2, "updatedAt" = now() WHERE id = $3',
    [data.title, data.description, id]
  );
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function deleteAnnualEvent(id: string) {
  await pool.query('DELETE FROM "annualEvent" WHERE id = $1', [id]);
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

// Photo Archive
export async function createPhotoArchive(data: Record<string, any>) {
  const photoUrl = await handleFileUpload(data.photoUrl);
  if (!photoUrl) return; // Prevent empty image creations
  await pool.query(
    'INSERT INTO "photoArchive" (id, "photoUrl", "orderIndex") VALUES (gen_random_uuid()::text, $1, $2)',
    [photoUrl, data.orderIndex || 0]
  );
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function deletePhotoArchive(id: string) {
  await pool.query('DELETE FROM "photoArchive" WHERE id = $1', [id]);
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function updatePhotoArchiveOrder(orderedIds: string[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE "photoArchive" SET "orderIndex" = $1 WHERE id = $2', [i, orderedIds[i]]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

export async function updateMilestoneOrder(orderedIds: string[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE "milestone" SET "orderIndex" = $1 WHERE id = $2', [i, orderedIds[i]]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  revalidatePath("/admin/about");
  revalidatePath("/about");
}
