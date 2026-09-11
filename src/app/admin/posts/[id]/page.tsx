import { updatePost } from "../../actions";
import { PostForm } from "@/components/admin/PostForm";
import pool from "@/lib/db";
import { redirect } from "next/navigation";

export default async function EditPost({ params }: { params: { id: string } }) {
  const { id } = await params;
  const res = await pool.query('SELECT * FROM "post" WHERE id = $1', [id]);
  const post = res.rows[0];

  if (!post) {
    redirect("/admin/posts");
  }

  const catRes = await pool.query('SELECT DISTINCT category FROM "post" WHERE category IS NOT NULL');
  const categories = catRes.rows.map(r => r.category);

  const authRes = await pool.query('SELECT DISTINCT author FROM "post" WHERE author IS NOT NULL');
  const authors = authRes.rows.map(r => r.author);

  async function action(formData: FormData) {
    "use server";
    await updatePost(id, {
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

  return <PostForm initialData={post} categories={categories} authors={authors} action={action} />;
}
