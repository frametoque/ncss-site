import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Nalanda College Science Society",
  description: "Terms and conditions for using the Nalanda College Science Society website.",
};

export default function TermsPage() {
  return (
    <article className="container mx-auto px-4 md:px-8 py-24 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-700 hover:prose-a:text-maroon-800">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing the Nalanda College Science Society (NCSS) website, you agree to abide by these terms of use. This platform is operated by the student executive committee for educational and extracurricular purposes.
        </p>
        
        <h2>2. Educational Purpose</h2>
        <p>
          All materials, event details, and publications on this website are provided for informational and educational purposes. While we strive to keep information accurate and up to date, the society, its members, and Nalanda College are not liable for any unintentional errors or omissions.
        </p>
        
        <h2>3. Code of Conduct</h2>
        <p>
          When interacting with our platform—such as submitting forms or registering for competitions—you agree to provide accurate information and conduct yourself in a manner befitting the standards of a student educational institution.
        </p>
        
        <h2>4. Intellectual Property</h2>
        <p>
          Content published on this site, including Pulse Quest magazines, articles, and media, is the property of the Nalanda College Science Society and its respective student authors. You may download and share this content for personal, non-commercial educational use.
        </p>
        
        <h2>5. Event Registrations</h2>
        <p>
          Registration for NCSS events through this site is subject to the specific rules and deadlines of each competition. The executive committee reserves the right to review and validate all submissions.
        </p>
      </div>
    </article>
  );
}
