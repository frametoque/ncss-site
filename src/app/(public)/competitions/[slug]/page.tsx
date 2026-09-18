import { Calendar, MapPin, Trophy, Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { isCompetitionEnded } from "@/lib/utils";
import pool from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const res = await pool.query('SELECT title, description, "coverImage" FROM "competition" WHERE slug = $1', [slug]);
  if (res.rows.length === 0) return {};
  const comp = res.rows[0];

  return {
    title: comp.title,
    description: comp.description || `Register for ${comp.title} hosted by NCSS.`,
    openGraph: {
      title: comp.title,
      description: comp.description,
      images: comp.coverImage ? [comp.coverImage] : [],
    }
  };
}
export default async function CompetitionDetailsPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const compRes = await pool.query('SELECT * FROM "competition" WHERE slug = $1', [slug]);

  if (compRes.rows.length === 0) {
    notFound();
  }

  const compItem = compRes.rows[0];
  const ended = isCompetitionEnded(compItem);

  const formsRes = await pool.query('SELECT * FROM "form" WHERE "competitionId" = $1 AND "isActive" = true ORDER BY "createdAt" ASC', [compItem.id]);
  const linkedForms = formsRes.rows;

  const quizRes = await pool.query('SELECT * FROM quiz_category WHERE "competitionId" = $1 ORDER BY name ASC', [compItem.id]);
  const quizzes = quizRes.rows;

  return (
    <article className="container mx-auto px-4 md:px-8 py-16 max-w-[1400px]">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          {ended && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 tracking-wide uppercase">
              Ended
            </span>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 mb-6 leading-tight max-w-4xl">
          {compItem.title}
        </h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Content */}
        <div className="lg:col-span-8 min-w-0">
          {compItem.coverImage && (
            <div className="w-full max-w-xl mx-auto mb-12 rounded-3xl overflow-hidden shadow-md">
              <Image src={compItem.coverImage} alt={compItem.title} width={1200} height={1200} className="w-full h-auto block" />
            </div>
          )}

          <div
            className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-600 hover:prose-a:text-maroon-800 prose-ul:list-disc prose-li:marker:text-maroon-500 break-words whitespace-pre-wrap overflow-hidden"
            dangerouslySetInnerHTML={{ __html: compItem.content }}
          />
        </div>

        {/* Right Side: Registration Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6 border-b border-gray-100 pb-4">
              Competition Details
            </h3>

            <ul className="space-y-6 mb-8">
              {compItem.date && (
                <li className="flex items-start gap-4">
                  <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Date</p>
                    <p className="text-gray-600">{compItem.date}</p>
                  </div>
                </li>
              )}

              {compItem.deadline && (
                <li className="flex items-start gap-4">
                  <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Deadline</p>
                    <p className="text-gray-600">{compItem.deadline}</p>
                  </div>
                </li>
              )}

              {compItem.location && (
                <li className="flex items-start gap-4">
                  <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Location</p>
                    <p className="text-gray-600">{compItem.location}</p>
                  </div>
                </li>
              )}

              {compItem.teamSize && (
                <li className="flex items-start gap-4">
                  <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Team Size</p>
                    <p className="text-gray-600">{compItem.teamSize}</p>
                  </div>
                </li>
              )}
            </ul>

            {compItem.deadline && (
              <div className="bg-gray-50 rounded-2xl p-4 text-center mb-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Registration Deadline</p>
                <p className="font-bold text-gray-900">{compItem.deadline}</p>
              </div>
            )}

            {compItem.rulesPdf && (
              <Button size="lg" variant="outline" className="w-full rounded-xl h-14 text-lg border-maroon-200 text-maroon-700 hover:bg-maroon-50 mb-4" asChild>
                <a href={compItem.rulesPdf} target="_blank" rel="noopener noreferrer">
                  Download Rules & Regs
                </a>
              </Button>
            )}

            {linkedForms.length > 0 ? (
              <div className="space-y-3 mt-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">Available Forms</p>
                {linkedForms.map(form => (
                  <Button key={form.id} size="lg" className="w-full rounded-xl h-14 text-lg shadow-lg shadow-maroon-500/30" asChild>
                    <Link href={`/forms/${form.slug}`}>
                      {form.title} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ))}
              </div>
            ) : (
              !ended && quizzes.length === 0 && (
                <Button size="lg" disabled className="w-full rounded-xl h-14 text-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                  Registration Closed
                </Button>
              )
            )}

            {compItem.acceptingQuizAnswers && quizzes.length > 0 && (
              <div className="space-y-3 mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm font-semibold text-maroon-700 uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" /> Live Quizzes
                </p>
                {quizzes.map(quiz => (
                  <Button key={quiz.id} variant="outline" size="lg" className="w-full rounded-xl h-14 text-lg border-maroon-200 text-maroon-800 hover:bg-maroon-50" asChild>
                    <Link href={`/competitions/${slug}/quiz/${quiz.id}`}>
                      {quiz.name} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
