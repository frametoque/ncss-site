import { Metadata } from "next";
import pool from "@/lib/db";
import { HistoryForm } from "@/components/admin/about/HistoryForm";
import { MilestoneManager } from "@/components/admin/about/MilestoneManager";
import { EventManager } from "@/components/admin/about/EventManager";
import { PhotoArchiveManager } from "@/components/admin/about/PhotoArchiveManager";

import { AboutTabs } from "@/components/admin/about/AboutTabs";

export const metadata: Metadata = {
  title: "About Page Content | Admin Dashboard",
};

export default async function AdminAboutPage() {


  // Fetch History
  let historyRes;
  try {
    historyRes = await pool.query('SELECT * FROM "history"');
  } catch(e) {
    historyRes = { rows: [] };
  }
  const historyData = historyRes.rows;
  const ourHistory = historyData.find((h: any) => h.sectionKey === 'our-history') || {};
  const magazineFounder = historyData.find((h: any) => h.sectionKey === 'magazine-founder') || {};
  const ourVision = historyData.find((h: any) => h.sectionKey === 'our-vision') || {};
  const ourMission = historyData.find((h: any) => h.sectionKey === 'our-mission') || {};

  // Fetch Milestones
  let milestonesRes;
  try {
    milestonesRes = await pool.query('SELECT * FROM "milestone" ORDER BY "orderIndex" ASC, "year" DESC');
  } catch(e) {
    milestonesRes = { rows: [] };
  }
  const milestones = milestonesRes.rows;

  // Fetch Events
  let eventsRes;
  try {
    eventsRes = await pool.query('SELECT * FROM "annualEvent" ORDER BY "orderIndex" ASC');
  } catch(e) {
    eventsRes = { rows: [] };
  }
  const events = eventsRes.rows;

  // Fetch Photo Archive
  let photosRes;
  try {
    photosRes = await pool.query('SELECT * FROM "photoArchive" ORDER BY "orderIndex" ASC');
  } catch(e) {
    photosRes = { rows: [] };
  }
  const photos = photosRes.rows;

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-maroon-900">About Page Content</h1>
      </div>

      <AboutTabs>
        {/* History Section Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Our History</h2>
          <HistoryForm key="our-history" sectionKey="our-history" initialData={ourHistory} />
        </section>

        {/* Vision Section Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Our Vision</h2>
          <HistoryForm key="our-vision" sectionKey="our-vision" initialData={ourVision} />
        </section>

        {/* Mission Section Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Our Mission</h2>
          <HistoryForm key="our-mission" sectionKey="our-mission" initialData={ourMission} />
        </section>

        {/* Pulse Quest Magazine Founder Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Pulse Quest Magazine Section</h2>
          <HistoryForm key="magazine-founder" sectionKey="magazine-founder" initialData={magazineFounder} hasImage />
        </section>

        {/* Milestones Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Milestones</h2>
          <MilestoneManager initialData={milestones} />
        </section>

        {/* Annual Events Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Annual Events</h2>
          <EventManager initialData={events} />
        </section>

        {/* Old Photo Archive Config */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-maroon-100">
          <h2 className="text-2xl font-bold text-maroon-900 mb-6">Old Photo Archive</h2>
          <PhotoArchiveManager initialData={photos} />
        </section>
      </AboutTabs>
    </div>
  );
}
