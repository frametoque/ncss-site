import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Nalanda College Science Society",
  description: "Cookie policy for the Nalanda College Science Society website.",
};

export default function CookiesPage() {
  return (
    <article className="container mx-auto px-4 md:px-8 py-24 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-8">Cookie Policy</h1>
      <div className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-700 hover:prose-a:text-maroon-800">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files placed on your device to help websites function smoothly. Our website uses minimal cookies to ensure you have a seamless browsing experience while reading our articles and registering for events.
        </p>
        
        <h2>2. How We Use Cookies</h2>
        <p>
          As an educational student society, we do not use cookies for targeted advertising or commercial tracking. We use cookies primarily for:
        </p>
        <ul>
          <li><strong>Essential Functions:</strong> Keeping the website running securely and managing your form submissions.</li>
          <li><strong>Basic Analytics:</strong> Understanding generally which pages (like news or competitions) are most helpful to our students and visitors.</li>
        </ul>
        
        <h2>3. Managing Cookies</h2>
        <p>
          You can adjust your browser settings to refuse cookies. However, please note that disabling cookies might affect your ability to smoothly submit registration forms or interact with certain features on our site.
        </p>
      </div>
    </article>
  );
}
