import { updateCompetition } from "../../actions";
import { CompetitionForm } from "@/components/admin/CompetitionForm";
import pool from "@/lib/db";
import { redirect } from "next/navigation";

export default async function EditCompetition({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await pool.query('SELECT * FROM "competition" WHERE id = $1', [id]);
  const comp = res.rows[0];

  if (!comp) {
    redirect("/admin/competitions");
  }

  async function action(formData: FormData) {
    "use server";
    await updateCompetition(id, {
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      isEnded: formData.get("isEnded") === "on",
      isQuiz: formData.get("isQuiz") === "on",
      date: formData.get("date"),
      time: formData.get("time"),
      location: formData.get("location"),
      deadline: formData.get("deadline"),
      content: formData.get("content"),
      coverImage: formData.get("coverImage"),
      rulesPdf: formData.get("rulesPdf"),
    });
    redirect("/admin/competitions");
  }

  return <CompetitionForm initialData={comp} action={action} />;
}
