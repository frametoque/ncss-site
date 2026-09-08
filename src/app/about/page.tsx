import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const team = [
    { name: "John Doe", role: "President" },
    { name: "Jane Smith", role: "Vice President" },
    { name: "Alex Johnson", role: "Secretary" },
    { name: "Emily Brown", role: "Treasurer" },
    { name: "Michael Lee", role: "Chief Editor" },
    { name: "Sarah Davis", role: "Event Coordinator" },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      {/* History Section */}
      <section className="mb-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Our Legacy</h1>
          <p className="text-lg text-gray-600">
            Since its founding, the Nalanda College Science Society has been at the forefront of scientific exploration within the school. Our mission is to cultivate a deep appreciation for the sciences and provide a platform for students to innovate.
          </p>
        </div>
        
        <div className="bg-maroon-50 rounded-3xl p-8 md:p-12 border border-maroon-100">
          <h2 className="text-2xl font-bold font-heading text-gray-900 mb-6">Our Mission</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                To inspire and engage students in the wonders of science, technology, engineering, and mathematics (STEM). We strive to bridge the gap between theoretical learning and practical application.
              </p>
            </div>
            <div>
              <ul className="space-y-3 text-gray-700 list-disc list-inside">
                <li>Organizing inter-school and intra-school competitions</li>
                <li>Publishing our annual science magazine</li>
                <li>Conducting workshops and guest lectures</li>
                <li>Fostering a community of curious minds</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-heading text-gray-900 mb-4">Executive Board</h2>
          <p className="text-gray-600">Meet the dedicated students leading the society this year.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <div key={i} className="text-center group">
              <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-md relative">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  Photo
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm font-medium text-maroon-600">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
