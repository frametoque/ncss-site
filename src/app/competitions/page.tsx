import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

export default function CompetitionsPage() {
  const competitions = [
    {
      title: "Inter-School Science Olympiad 2024",
      isEnded: false,
      date: "March 15, 2024",
      category: "Olympiad",
      description: "Annual science olympiad gathering the brightest minds from across the country to compete in physics, chemistry, and biology.",
    },
    {
      title: "Nalanda Astro Quiz",
      isEnded: false,
      date: "Feb 10 - Feb 20, 2024",
      category: "Quiz",
      description: "Test your knowledge of the cosmos in our online astronomy and astrophysics quiz.",
    },
    {
      title: "Science Fair 2023",
      isEnded: true,
      date: "Nov 5, 2023",
      category: "Exhibition",
      description: "Showcase of innovative student projects focusing on sustainable technology and renewable energy.",
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Competitions & Events</h1>
        <p className="text-lg text-gray-600">
          Participate in our events to challenge yourself, meet fellow science enthusiasts, and win exciting prizes.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {competitions.map((comp, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* 1:1 Image Thumbnail */}
            <div className="w-full md:w-48 xl:w-56 aspect-square bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center border border-gray-200 overflow-hidden">
              <span className="text-gray-400 font-medium text-sm">Cover Image</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {comp.isEnded && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    Event Ended
                  </span>
                )}
                <span className="text-sm font-medium text-maroon-600 uppercase tracking-wider">{comp.category}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{comp.title}</h2>
              <p className="text-gray-600 mb-4">{comp.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {comp.date}</div>
              </div>
            </div>
            <div className="flex w-full md:w-auto md:flex-col items-center justify-end gap-3 mt-4 md:mt-0">
              <Button asChild className="w-full md:w-auto">
                <Link href={`/competitions/placeholder-${i}`}>View Details</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
