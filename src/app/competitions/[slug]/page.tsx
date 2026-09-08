import { Calendar, MapPin, Trophy, Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CompetitionDetailsPage({ params }: { params: { slug: string } }) {
  // Placeholder data for the competition details
  const compItem = {
    title: "Inter-School Science Olympiad 2024",
    isEnded: false,
    date: "March 15, 2024",
    time: "08:00 AM - 04:00 PM",
    location: "Nalanda College Main Hall",
    category: "Olympiad",
    deadline: "March 01, 2024",
    content: `
      <h2>About the Event</h2>
      <p>The Inter-School Science Olympiad is our flagship annual event that brings together the brightest young minds from schools across the country. It is designed to test theoretical knowledge and practical application in Physics, Chemistry, and Biology.</p>
      
      <h2>Competition Structure</h2>
      <p>The competition is divided into two main rounds:</p>
      <ul>
        <li><strong>Round 1 (Morning):</strong> A comprehensive written examination covering advanced high school curriculum topics.</li>
        <li><strong>Round 2 (Afternoon):</strong> A practical laboratory challenge where teams must solve experimental problems.</li>
      </ul>

      <h2>Rules & Eligibility</h2>
      <p>Participation is open to A/L science stream students. Each school may register up to two teams, consisting of three members per team. Participants must carry their valid school ID cards on the day of the event.</p>

      <h2>Rules & Eligibility</h2>
      <p>Participation is open to A/L science stream students. Each school may register up to two teams, consisting of three members per team. Participants must carry their valid school ID cards on the day of the event.</p>

      <h2>Prizes</h2>
      <p>Exciting awards await the top performers, including:</p>
      <ul>
        <li><strong>1st Place:</strong> Championship Trophy, Gold Medals, and Rs. 50,000 cash prize.</li>
        <li><strong>2nd Place:</strong> Silver Medals and Rs. 30,000 cash prize.</li>
        <li><strong>3rd Place:</strong> Bronze Medals and Rs. 15,000 cash prize.</li>
      </ul>
      <p>All participants will receive a certificate of participation.</p>
    `
  };

  return (
    <article className="container mx-auto px-4 md:px-8 py-16 max-w-[1400px]">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          {compItem.isEnded && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 tracking-wide uppercase">
              Event Ended
            </span>
          )}
          <span className="text-sm font-bold text-maroon-600 uppercase tracking-wider">
            {compItem.category}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 mb-6 leading-tight max-w-4xl">
          {compItem.title}
        </h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Content */}
        <div className="lg:col-span-8">
          <div className="w-full aspect-square bg-gray-100 rounded-3xl mb-12 flex items-center justify-center border border-gray-200 overflow-hidden shadow-md">
            <span className="text-gray-400 font-medium text-lg">1:1 Event Cover Image Placeholder</span>
          </div>

          <div 
            className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-600 hover:prose-a:text-maroon-800 prose-ul:list-disc prose-li:marker:text-maroon-500"
            dangerouslySetInnerHTML={{ __html: compItem.content }}
          />
        </div>

        {/* Right Side: Registration Card */}
        <div className="lg:col-span-4 sticky top-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6 border-b border-gray-100 pb-4">
              Event Details
            </h3>
            
            <ul className="space-y-6 mb-8">
              <li className="flex items-start gap-4">
                <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Date</p>
                  <p className="text-gray-600">{compItem.date}</p>
                </div>
              </li>
              
              <li className="flex items-start gap-4">
                <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Time</p>
                  <p className="text-gray-600">{compItem.time}</p>
                </div>
              </li>
              
              <li className="flex items-start gap-4">
                <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p className="text-gray-600">{compItem.location}</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="bg-maroon-50 p-3 rounded-full text-maroon-600 shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Team Size</p>
                  <p className="text-gray-600">3 Members per team</p>
                </div>
              </li>
            </ul>

            <div className="bg-gray-50 rounded-2xl p-4 text-center mb-6 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Registration Deadline</p>
              <p className="font-bold text-gray-900">{compItem.deadline}</p>
            </div>

            <Button size="lg" className="w-full rounded-full h-14 text-lg shadow-lg shadow-maroon-500/30">
              Register Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
