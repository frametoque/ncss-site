import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint | Nalanda College Science Society",
  description: "Imprint and legal disclosure for the Nalanda College Science Society website.",
};

export default function ImprintPage() {
  return (
    <article className="container mx-auto px-4 md:px-8 py-24 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-8">Imprint</h1>
      <div className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-700 hover:prose-a:text-maroon-800">
        <h2>Organization Details</h2>
        <p>
          <strong>Nalanda College Science Society (NCSS)</strong><br />
          Nalanda College<br />
          Colombo 10, 01000<br />
          Sri Lanka
        </p>

        <h2>Status</h2>
        <p>
          NCSS is a student-led educational society functioning under the administration of Nalanda College, a government school in Sri Lanka. It operates entirely for the extracurricular and academic advancement of students.
        </p>

        <h2>Representation</h2>
        <p>
          The society is operated by the Student Executive Committee under the direct guidance and supervision of the Principal of Nalanda College and the appointed Teachers-in-Charge of the Science Society.
        </p>

        <h2>Contact Information</h2>
        <p>
          Email: <a href="mailto:info@ncsciencesociety.com">info@ncsciencesociety.com</a><br />
          Address: Nalanda College, Colombo 10, Sri Lanka.
        </p>
      </div>
    </article>
  );
}
