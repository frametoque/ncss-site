import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SlideUp } from "@/components/animations/SlideUp";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerGroup";

import pool from "@/lib/db";
import { Metadata } from "next";
import { isCompetitionEnded } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Participate in science competitions hosted by the Nalanda College Science Society.",
};

export default async function CompetitionsPage() {
  const compRes = await pool.query('SELECT * FROM "competition" ORDER BY "createdAt" DESC');
  const competitions = compRes.rows;

  return (
    <div className="container mx-auto px-4 py-16">
      <SlideUp className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Competitions</h1>
        <p className="text-lg text-gray-600">
          Participate in our competitions to challenge yourself, meet fellow science enthusiasts, and win exciting prizes.
        </p>
      </SlideUp>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {competitions.map((comp) => {
          const ended = isCompetitionEnded(comp);
          return (
            <StaggerItem key={comp.id} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${ended ? 'opacity-80' : ''}`}>
              {/* 1:1 Image Thumbnail */}
              <Link href={`/competitions/${comp.slug}`} className={`block w-full aspect-square bg-gray-100 rounded-xl mb-5 flex-shrink-0 flex items-center justify-center border border-gray-200 overflow-hidden relative group-hover:opacity-90 transition-opacity`}>
                {comp.coverImage ? (
                  <Image src={comp.coverImage} alt={comp.title} fill className="object-cover transition-transform duration-500 hover:scale-105" />
                ) : (
                  <span className="text-gray-400 font-medium text-sm">Cover Image</span>
                )}
              </Link>

              <div className="flex flex-col flex-1 items-center text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{comp.title}</h2>
                
                { (comp.deadline || comp.date) ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 text-maroon-500 flex-shrink-0" /> 
                    <span className="truncate">Deadline: {comp.deadline || comp.date}</span>
                  </div>
                ) : (
                  <div className="mb-2"></div>
                )}

                <div className="flex items-center justify-center gap-3 mb-3 flex-wrap mt-1">
                  {ended && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      Ended
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm flex-1">{comp.description}</p>
                
                <div className="w-full mt-auto pt-4 border-t border-gray-100">
                  <Link href={`/competitions/${comp.slug}`} className="block w-full">
                    <Button className="w-full bg-maroon-50 hover:bg-maroon-600 text-maroon-700 hover:text-white transition-colors rounded-xl font-semibold border-none">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
