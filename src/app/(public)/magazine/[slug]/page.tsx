import pool from "@/lib/db";
import { notFound } from "next/navigation";
import FlipbookWrapper from "@/components/ui/FlipbookWrapper";
import { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const res = await pool.query('SELECT title, "issueNumber", "volumeNumber", "coverThumbnail" FROM "magazine" WHERE slug = $1', [slug]);
  if (res.rows.length === 0) return {};
  const mag = res.rows[0];
  
  return {
    title: `${mag.title} - Vol ${mag.volumeNumber}, Issue #${mag.issueNumber}`,
    description: `Read Vol ${mag.volumeNumber}, Issue #${mag.issueNumber} of the Nalanda College Science Society magazine: ${mag.title}.`,
    openGraph: {
      title: `${mag.title} - Vol ${mag.volumeNumber}, Issue #${mag.issueNumber}`,
      description: `Read Vol ${mag.volumeNumber}, Issue #${mag.issueNumber} of the Nalanda College Science Society magazine: ${mag.title}.`,
      images: mag.coverThumbnail ? [mag.coverThumbnail] : [],
    }
  };
}
export default async function PublicationDetailsPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const magRes = await pool.query('SELECT * FROM "magazine" WHERE slug = $1', [slug]);
  
  if (magRes.rows.length === 0) {
    notFound();
  }
  
  const magazine = magRes.rows[0];

  return (
    <div className="container mx-auto px-2 pt-12 pb-4 flex flex-col items-center">
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-gray-900">{magazine.title}</h1>
        <p className="text-gray-500 mt-2 text-sm">Vol {magazine.volumeNumber}, Issue {magazine.issueNumber} • Published on {new Date(magazine.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-2">
        <FlipbookWrapper pdfUrl={magazine.pdfUrl} />
      </div>
    </div>
  );
}
