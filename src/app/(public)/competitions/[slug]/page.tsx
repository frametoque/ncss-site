import { Calendar, MapPin, Trophy, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { isCompetitionEnded, formatDateString } from "@/lib/utils";
import pool from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { groupCategoriesBySubject } from "@/lib/quizSubjects";
import { sanitizeHtml } from "@/lib/sanitize";

type Params = Promise<{ slug: string }>;

export const revalidate = 60;

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

interface CompetitionItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string | null;
  date?: string | null;
  deadline?: string | null;
  location?: string | null;
  teamSize?: string | null;
  rulesPdf?: string | null;
  acceptingQuizAnswers?: boolean;
}

interface LinkedForm {
  id: string;
  title: string;
  slug: string;
}

interface QuizItem {
  id: string;
  name: string;
}

interface CompetitionDetailsCardProps {
  compItem: CompetitionItem;
  ended: boolean;
  linkedForms: LinkedForm[];
  quizzes: QuizItem[];
  slug: string;
}

function CompetitionDetailsCard({
  compItem,
  ended,
  linkedForms,
  quizzes,
  slug,
}: CompetitionDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-200 shadow-xl">
      <h3 className="text-xl sm:text-2xl font-bold font-heading text-gray-900 mb-6 border-b border-gray-100 pb-4">
        Competition Details
      </h3>

      <ul className="space-y-4 sm:space-y-6 mb-8">
        {compItem.date && (
          <li className="flex items-start gap-3 sm:gap-4">
            <div className="bg-maroon-50 p-2.5 sm:p-3 rounded-full text-maroon-600 shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Date</p>
              <p className="text-gray-600 text-sm sm:text-base">{formatDateString(compItem.date)}</p>
            </div>
          </li>
        )}

        {compItem.deadline && (
          <li className="flex items-start gap-3 sm:gap-4">
            <div className="bg-maroon-50 p-2.5 sm:p-3 rounded-full text-maroon-600 shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Deadline</p>
              <p className="text-gray-600 text-sm sm:text-base">{formatDateString(compItem.deadline)}</p>
            </div>
          </li>
        )}

        {compItem.location && (
          <li className="flex items-start gap-3 sm:gap-4">
            <div className="bg-maroon-50 p-2.5 sm:p-3 rounded-full text-maroon-600 shrink-0">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Location</p>
              <p className="text-gray-600 text-sm sm:text-base break-words">{compItem.location}</p>
            </div>
          </li>
        )}

        {compItem.teamSize && (
          <li className="flex items-start gap-3 sm:gap-4">
            <div className="bg-maroon-50 p-2.5 sm:p-3 rounded-full text-maroon-600 shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Team Size</p>
              <p className="text-gray-600 text-sm sm:text-base">{compItem.teamSize}</p>
            </div>
          </li>
        )}
      </ul>

      {compItem.rulesPdf && (
        <Button size="lg" variant="outline" className="w-full rounded-xl min-h-[3rem] sm:min-h-[3.5rem] h-auto py-3 px-4 text-base sm:text-lg border-maroon-200 text-maroon-700 hover:bg-maroon-50 mb-4 whitespace-normal text-center" asChild>
          <a href={compItem.rulesPdf} target="_blank" rel="noopener noreferrer">
            Download Rules & Regs
          </a>
        </Button>
      )}

      {linkedForms.length > 0 ? (
        <div className="space-y-3 mt-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">Available Forms</p>
          {linkedForms.map(form => (
            <Button key={form.id} size="lg" className="w-full rounded-xl min-h-[3rem] sm:min-h-[3.5rem] h-auto py-3 px-4 text-base sm:text-lg shadow-lg shadow-maroon-500/30 whitespace-normal text-center" asChild>
              <Link href={`/forms/${form.slug}`}>
                <span className="truncate">{form.title}</span> <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
              </Link>
            </Button>
          ))}
        </div>
      ) : (
        !ended && quizzes.length === 0 && (
          <Button size="lg" disabled className="w-full rounded-xl min-h-[3rem] sm:min-h-[3.5rem] h-auto py-3 px-4 text-base sm:text-lg bg-gray-200 text-gray-500 cursor-not-allowed">
            Registration Closed
          </Button>
        )
      )}

      {compItem.acceptingQuizAnswers && quizzes.length > 0 && (() => {
        const subjects = groupCategoriesBySubject(quizzes);
        return (
          <div className="space-y-3 mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm font-semibold text-maroon-700 uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4 shrink-0" /> Live Quizzes
            </p>
            {subjects.map(sub => (
              <Button key={sub.subject} variant="outline" size="lg" className="w-full rounded-xl min-h-[3rem] sm:min-h-[3.5rem] h-auto py-3 px-4 text-base sm:text-lg border-maroon-200 text-maroon-800 hover:bg-maroon-50 whitespace-normal text-center shadow-xs cursor-pointer group" asChild>
                <Link href={`/competitions/${slug}/quiz/${sub.categories[0].id}`}>
                  <span className="truncate font-semibold">{sub.subject}</span> <ArrowRight className="ml-2 h-4 w-4 shrink-0 text-maroon-400 group-hover:text-maroon-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </Button>
            ))}
          </div>
        );
      })()}
    </div>
  );
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

  const [formsRes, quizRes] = await Promise.all([
    pool.query('SELECT * FROM "form" WHERE "competitionId" = $1 AND "isActive" = true ORDER BY "createdAt" ASC', [compItem.id]),
    pool.query('SELECT * FROM quiz_category WHERE "competitionId" = $1 ORDER BY name ASC', [compItem.id])
  ]);
  const linkedForms = formsRes.rows;
  const quizzes = quizRes.rows;

  return (
    <article className="container mx-auto px-4 md:px-8 pt-8 pb-16 md:py-16 max-w-[1400px]">
      <div className="mb-6 md:mb-10">
        {ended && (
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 tracking-wide uppercase">
              Ended
            </span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 mb-4 md:mb-6 leading-tight max-w-4xl">
          {compItem.title}
        </h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Content */}
        <div className="lg:col-span-8 min-w-0">
          {compItem.coverImage && (
            <div className="w-full max-w-xl mx-auto mb-8 lg:mb-12 rounded-2xl md:rounded-3xl overflow-hidden shadow-md">
              <Image src={compItem.coverImage} alt={compItem.title} width={1200} height={1200} className="w-full h-auto block" priority />
            </div>
          )}

          {/* Mobile View: Details Card directly after Image, before Description */}
          <div className="lg:hidden mb-8 sm:mb-10">
            <CompetitionDetailsCard
              compItem={compItem}
              ended={ended}
              linkedForms={linkedForms}
              quizzes={quizzes}
              slug={slug}
            />
          </div>

          <div
            className="prose prose-base sm:prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-600 hover:prose-a:text-maroon-800 prose-ul:list-disc prose-li:marker:text-maroon-500 break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(compItem.content) }}
          />
        </div>

        {/* Right Side: Registration Card (Desktop only) */}
        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
          <CompetitionDetailsCard
            compItem={compItem}
            ended={ended}
            linkedForms={linkedForms}
            quizzes={quizzes}
            slug={slug}
          />
        </div>
      </div>
    </article>
  );
}
