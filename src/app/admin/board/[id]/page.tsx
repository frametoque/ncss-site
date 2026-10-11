import { updateExecutiveBoardMember } from "../../actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import Link from "next/link";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import { BoardForm } from "@/components/admin/BoardForm";

export default async function EditBoardMember({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await pool.query('SELECT * FROM "executiveBoard" WHERE id = $1', [id]);
  const member = res.rows[0];

  if (!member) {
    redirect("/admin/board");
  }

  async function action(formData: FormData) {
    "use server";
    await updateExecutiveBoardMember(id, {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      photoUrl: formData.get("photoUrl"),
      contactNumber: formData.get("contactNumber") as string,
    });
    redirect("/admin/board");
  }

  return <BoardForm initialData={member} action={action} />;
}
