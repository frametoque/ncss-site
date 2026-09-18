import { createCompetition } from "../../actions";
import { CompetitionForm } from "@/components/admin/CompetitionForm";
import { redirect } from "next/navigation";

export default function NewCompetition() {
  async function action(formData: FormData) {
    "use server";
    await createCompetition({
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

  return <CompetitionForm action={action} />;
}
