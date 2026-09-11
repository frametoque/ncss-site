import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { SlideUp } from "@/components/animations/SlideUp";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerGroup";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pulse Quest Magazine",
  description: "Read the latest issues of the Nalanda College Science Society magazine, featuring articles, research, and more.",
};

export default async function MagazinesPage() {
  const magsRes = await pool.query('SELECT * FROM "magazine" ORDER BY "createdAt" DESC');
  const magazines = magsRes.rows;

  return (
    <div className="container mx-auto px-4 py-16">
      <SlideUp className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Pulse Quest Magazine</h1>
        <p className="text-lg text-gray-600">
          The official Pulse Quest Magazine featuring the best research, essays, and scientific artwork from the Nalanda College student body.
        </p>
      </SlideUp>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {magazines.map((mag) => (
          <StaggerItem key={mag.id} className="flex flex-col items-center group">
            <Link href={`/magazine/${mag.slug}`} className="block w-full aspect-[3/4] bg-gray-100 rounded-lg shadow-sm border border-gray-200 mb-4 relative overflow-hidden group-hover:shadow-md transition-shadow">
              {mag.coverThumbnail ? (
                <Image src={mag.coverThumbnail} alt={mag.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Cover Art
                </div>
              )}
            </Link>
            <h3 className="text-lg font-bold text-gray-900">{mag.title}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Vol {mag.volumeNumber}, Issue {mag.issueNumber} • {new Date(mag.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/magazine/${mag.slug}`}>
                View Issue
              </Link>
            </Button>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
