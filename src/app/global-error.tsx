"use client";

import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${bricolage.variable}`}>
      <body className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 antialiased font-sans">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg text-center border border-gray-100">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 font-heading">Critical System Error</h1>
          <p className="text-gray-600 mb-8">
            The application experienced a critical failure and could not load the layout. Please try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-maroon-600 text-white font-semibold rounded-xl hover:bg-maroon-700 transition-colors shadow-sm"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
