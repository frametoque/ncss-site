import { createMagazine } from "../../actions";
import { MagazineForm } from "@/components/admin/MagazineForm";
import { redirect } from "next/navigation";

export default function NewMagazine() {
  async function action(formData: FormData) {
    "use server";
    await createMagazine({
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

  return <MagazineForm action={action} />;
}
