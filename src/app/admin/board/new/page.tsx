import { createExecutiveBoardMember } from "../../actions";
import { redirect } from "next/navigation";
import { BoardForm } from "@/components/admin/BoardForm";

export default function NewBoardMember() {
  async function action(formData: FormData) {
    "use server";
    await createExecutiveBoardMember({
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      photoUrl: formData.get("photoUrl"),
      contactNumber: formData.get("contactNumber") as string,
    });
    redirect("/admin/board");
  }

  return <BoardForm action={action} />;
}
