import { createPost } from "../../actions";
import { PostForm } from "@/components/admin/PostForm";
import pool from "@/lib/db";
import { redirect } from "next/navigation";

export default async function NewPost() {
  const catRes = await pool.query('SELECT DISTINCT category FROM "post" WHERE category IS NOT NULL');
  const categories = catRes.rows.map(r => r.category);

  const authRes = await pool.query('SELECT DISTINCT author FROM "post" WHERE author IS NOT NULL');
  const authors = authRes.rows.map(r => r.author);

  async function action(formData: FormData) {
    "use server";
    await createPost({
      title: formData.get("title"),
      slug: formData.get("slug"),
      category: formData.get("category"),
      coverImage: formData.get("coverImage"),
      content: formData.get("content"),
      excerpt: formData.get("excerpt"),
      author: formData.get("author"),
      // readingTime is auto-calculated in actions.ts
    });
    redirect("/admin/posts");
  }

  return <PostForm categories={categories} authors={authors} action={action} />;
}
