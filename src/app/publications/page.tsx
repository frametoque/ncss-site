import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function MagazinesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Publications</h1>
        <p className="text-lg text-gray-600">
          Our annual and biannual science magazines feature the best research, essays, and scientific artwork from the Nalanda College student body.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { year: 2023, issue: "Vol. 12" },
          { year: 2022, issue: "Vol. 11" },
          { year: 2021, issue: "Vol. 10" },
          { year: 2020, issue: "Vol. 9" },
        ].map((mag, i) => (
          <div key={i} className="flex flex-col items-center group">
            <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg shadow-sm border border-gray-200 mb-4 relative overflow-hidden group-hover:shadow-md transition-shadow">
               <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Cover Art
                </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{mag.year} Edition</h3>
            <p className="text-sm text-gray-500 mb-4">{mag.issue}</p>
            <Button variant="outline" size="sm" className="w-full">
              View Issue
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
