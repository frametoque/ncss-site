import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Nalanda College Science Society",
  description: "Privacy policy for the Nalanda College Science Society website.",
};

export default function PrivacyPage() {
  return (
    <article className="container mx-auto px-4 md:px-8 py-24 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-700 hover:prose-a:text-maroon-800">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to the Nalanda College Science Society (NCSS) website. As a student-led society within a Sri Lankan government school, we are committed to respecting your privacy. This policy outlines how we handle the information collected from students, parents, and other visitors engaging with our activities.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          We only collect personal information that you voluntarily provide to us when you register for our events, competitions , or when you contact our executive committee. This may include your name, school, grade, and contact details.
        </p>

        <h2>3. How We Use Your Information</h2>
        <p>
          The information collected is used strictly for administrative and educational purposes. Specifically, we use it to:
        </p>
        <ul>
          <li>Manage and organize student participation in competitions and events.</li>
          <li>Communicate event updates, schedules, and important announcements.</li>
          <li>Issue certificates and maintain society records.</li>
        </ul>

        <h2>4. Information Sharing</h2>
        <p>
          We do not sell, rent, or trade any personal information. Data may be shared internally with the society's executive committee and the Teachers-in-Charge solely for organizing and coordinating events.
        </p>

        <h2>5. Contact Us</h2>
        <p>
          If you have questions regarding this policy, please reach out to our executive committee via email or contact the Teachers-in-Charge at Nalanda College, Colombo 10, Sri Lanka.
        </p>
      </div>
    </article>
  );
}
