import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Image from "next/image";
import pool from "@/lib/db";
import { FadeIn } from "@/components/animations/FadeIn";
import { SlideUp } from "@/components/animations/SlideUp";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerGroup";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the legacy and mission of the Nalanda College Science Society, and meet our executive board.",
};

export default async function AboutPage() {
  const res = await pool.query('SELECT * FROM "executiveBoard" ORDER BY "orderIndex" ASC');
  const team = res.rows;

  let historyRes, milestoneRes, eventRes, photoRes;
  try {
    historyRes = await pool.query('SELECT * FROM "history"');
    milestoneRes = await pool.query('SELECT * FROM "milestone" ORDER BY "orderIndex" ASC, "year" DESC');
    eventRes = await pool.query('SELECT * FROM "annualEvent" ORDER BY "orderIndex" ASC');
    photoRes = await pool.query('SELECT * FROM "photoArchive" ORDER BY "orderIndex" ASC');
  } catch(e) {
    historyRes = { rows: [] };
    milestoneRes = { rows: [] };
    eventRes = { rows: [] };
    photoRes = { rows: [] };
  }

  const ourHistory = historyRes.rows.find((h: any) => h.sectionKey === 'our-history');
  const magFounder = historyRes.rows.find((h: any) => h.sectionKey === 'magazine-founder');
  const ourVision = historyRes.rows.find((h: any) => h.sectionKey === 'our-vision');
  const ourMission = historyRes.rows.find((h: any) => h.sectionKey === 'our-mission');

  const historyTitle = ourHistory?.title || "Our History";
  const historyContent = ourHistory?.content || "Founded decades ago, the Nalanda College Science Society has grown from a small group of enthusiasts to the premier scientific body within the school.";

  const magTitle = magFounder?.title || "Pulse Quest Magazine";
  const magContent = magFounder?.content || "Pulse Quest is more than just a magazine; it is a testament to student curiosity.";

  const visionTitle = ourVision?.title || "Our Vision";
  const visionContent = ourVision?.content || "To inspire and engage students in the wonders of science, technology, engineering, and mathematics (STEM). We strive to bridge the gap between theoretical learning and practical application.";

  const missionTitle = ourMission?.title || "Our Mission";
  const missionContent = ourMission?.content || "<ul><li>Organizing inter-school and intra-school competitions</li><li>Publishing our monthly science magazine</li><li>Conducting workshops and guest lectures</li><li>Fostering a community of curious minds</li></ul>";

  return (
    <div className="container mx-auto px-4 py-16">
      {/* History Section */}
      <section className="mb-24">
        <SlideUp className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Our Legacy</h1>
          <p className="text-lg text-gray-600">
            Since its founding, the Nalanda College Science Society has been at the forefront of scientific exploration within the school. Our mission is to cultivate a deep appreciation for the sciences and provide a platform for students to innovate.
          </p>
        </SlideUp>

        <FadeIn className="bg-maroon-50 rounded-3xl p-8 md:p-12 border border-maroon-100 mb-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-maroon-200">
            {/* Vision */}
            <div className="md:pr-8">
              <h2 className="text-2xl font-bold font-heading text-gray-900 mb-4">{visionTitle}</h2>
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none prose-ul:list-disc prose-ul:list-inside prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: visionContent }}
              />
            </div>
            
            {/* Mission */}
            <div className="pt-8 md:pt-0 md:pl-8">
              <h2 className="text-2xl font-bold font-heading text-gray-900 mb-4">{missionTitle}</h2>
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none prose-ul:list-disc prose-ul:list-inside prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: missionContent }}
              />
            </div>
          </div>
        </FadeIn>

        {/* Team Section */}
        <div className="mb-24">
          <SlideUp className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading text-gray-900 mb-4">Executive Board</h2>
            <p className="text-gray-600">Meet the dedicated students leading the society this year.</p>
          </SlideUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {team.map((member) => (
              <StaggerItem key={member.id} className="text-center group">
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-md relative transition-transform duration-300 group-hover:scale-105">
                  {member.photoUrl ? (
                    <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                      Photo
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm font-medium text-maroon-600">{member.role}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* History & Milestones */}
        <div className="grid lg:grid-cols-2 gap-12 mb-24">
          <SlideUp>
            <h2 className="text-3xl font-bold font-heading text-gray-900 mb-6">{historyTitle}</h2>
            <div 
              className="prose prose-gray text-gray-700 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: historyContent }}
            />
          </SlideUp>
          <div>
            <SlideUp>
              <h2 className="text-3xl font-bold font-heading text-gray-900 mb-6">Milestones</h2>
            </SlideUp>
            <StaggerContainer className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {milestoneRes.rows.map((milestone: any, i: number) => (
                <StaggerItem key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-maroon-100 text-maroon-600 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-transform duration-300 group-hover:scale-110">
                    <div className="w-2 h-2 bg-maroon-600 rounded-full" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="text-maroon-600 font-bold text-sm mb-1">{milestone.year}</div>
                    <h4 className="font-semibold text-gray-900 mb-1 break-words">{milestone.title}</h4>
                    <p className="text-sm text-gray-600 break-words">{milestone.description}</p>
                  </div>
                </StaggerItem>
              ))}
              {milestoneRes.rows.length === 0 && (
                <p className="text-gray-500 italic relative z-10 bg-white pl-4">No milestones added yet.</p>
              )}
            </StaggerContainer>
          </div>
        </div>

        {/* Annual Events */}
        <FadeIn className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 mb-24">
          <SlideUp>
            <h2 className="text-3xl font-bold font-heading text-gray-900 mb-8 text-center">Annual Events</h2>
          </SlideUp>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {eventRes.rows.map((event: any) => (
              <StaggerItem key={event.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                <p className="text-gray-600">{event.description}</p>
              </StaggerItem>
            ))}
            {eventRes.rows.length === 0 && (
              <p className="text-gray-500 italic text-center md:col-span-3">No annual events added yet.</p>
            )}
          </StaggerContainer>
        </FadeIn>

        <FadeIn className="bg-maroon-900 text-white rounded-3xl p-8 md:p-12 mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-maroon-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          <StaggerContainer className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            <StaggerItem className="flex-1 min-w-0">
              <div className="inline-block px-3 py-1 bg-maroon-800 text-maroon-100 rounded-full text-sm font-semibold mb-4 border border-maroon-700">Flagship Publication</div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 truncate">{magTitle}</h2>
              <div 
                className="text-maroon-100 mb-6 text-lg prose prose-invert max-w-none prose-p:leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: magContent }}
              />
            </StaggerItem>
            <StaggerItem className="w-48 h-48 md:w-64 md:h-64 bg-maroon-950 rounded-2xl shrink-0 flex items-center justify-center border-4 border-maroon-800 relative z-10 shadow-2xl overflow-hidden transition-transform duration-500 hover:scale-105">
              {magFounder?.photoUrl ? (
                <Image src={magFounder.photoUrl} alt="Founder Photo" fill className="object-cover" />
              ) : (
                <span className="text-maroon-700 font-medium text-center px-4">Founder Photo / Cover Placeholder</span>
              )}
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>

        {/* Old Photo Archive */}
        <div className="mb-24">
          <SlideUp className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading text-gray-900 mb-4">Old Photo Archive</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">A glimpse into our rich past, memories, and the legacy left behind by previous generations.</p>
          </SlideUp>
          <StaggerContainer className="columns-2 md:columns-4 gap-4 space-y-4">
            {photoRes.rows.map((photo: any) => (
              <StaggerItem key={photo.id} className="break-inside-avoid relative rounded-2xl overflow-hidden shadow-sm group bg-gray-100 border border-gray-200 w-full mb-4 inline-block">
                <Image 
                  src={photo.photoUrl} 
                  alt="Archive Photo" 
                  width={0} 
                  height={0} 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ width: '100%', height: 'auto' }}
                  className="transition-transform duration-700 group-hover:scale-110 block" 
                />
              </StaggerItem>
            ))}
            {photoRes.rows.length === 0 && (
              <div className="col-span-2 md:col-span-4 text-center text-gray-500 italic py-12">
                No archive photos added yet.
              </div>
            )}
          </StaggerContainer>
        </div>

      </section>
    </div>
  );
}
