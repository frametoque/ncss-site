import { updateMagazine } from "../../actions";
import { MagazineForm } from "@/components/admin/MagazineForm";
import pool from "@/lib/db";
import { redirect } from "next/navigation";

export default async function EditMagazine({ params }: { params: { id: string } }) {
  const { id } = await params;
  const res = await pool.query('SELECT * FROM "magazine" WHERE id = $1', [id]);
  const mag = res.rows[0];

  if (!mag) {
    redirect("/admin/magazines");
  }

  async function action(formData: FormData) {
    "use server";
    await updateMagazine(id, {
      volumeNumber: parseInt(formData.get("volumeNumber") as string) || 1,
      issueNumber: parseInt(formData.get("issueNumber") as string) || 1,
      title: formData.get("title"),
      coverThumbnail: formData.get("coverThumbnail"),
      outNowImage: formData.get("outNowImage"),
      pdfUrl: formData.get("pdfUrl"),
      createdAt: formData.get("createdAt"),
    });
    redirect("/admin/magazines");
  }

  return <MagazineForm initialData={mag} action={action} />;
}
