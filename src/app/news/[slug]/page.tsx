import { Calendar, User } from "lucide-react";

export default function NewsDetailsPage({ params }: { params: { slug: string } }) {
  // Placeholder data for the news details
  const newsItem = {
    title: "The Future of Quantum Computing in Education",
    date: "October 12, 2023",
    author: "Jane Doe",
    category: "Science",
    content: `
      <p>Quantum mechanics is no longer just a theoretical framework discussed in advanced university physics courses. As technology rapidly evolves, the basic concepts of quantum computing are beginning to trickle down into high school education, fundamentally shifting how we approach problem-solving and information processing.</p>
      
      <h3>What is Quantum Computing?</h3>
      <p>Unlike classical computers which rely on bits (0s and 1s), quantum computers use quantum bits or qubits. These qubits can exist in multiple states simultaneously, a phenomenon known as superposition. Additionally, they can be entangled, meaning the state of one qubit is directly related to the state of another, regardless of the distance between them.</p>

      <p>These unique properties allow quantum computers to process vast amounts of data and perform complex calculations at speeds that are unimaginable for traditional computers. For students, this opens up entirely new paradigms for learning computer science and mathematics.</p>

      <h3>The Educational Shift</h3>
      <p>Integrating quantum concepts into early education requires a paradigm shift. We must move away from purely deterministic models of computing and introduce probabilistic thinking earlier in the curriculum. The Nalanda College Science Society is currently piloting a new workshop series designed to introduce these concepts through interactive simulations and simple programming exercises.</p>

      <blockquote>"The key to the future is not just teaching students how to use the technology, but how to think in the new paradigms that the technology requires."</blockquote>

      <p>As we continue to explore these frontiers, our goal is to ensure that our students are not just passive consumers of tomorrow's technology, but active creators and innovators.</p>
    `
  };

  return (
    <article className="container mx-auto px-4 md:px-8 py-16 max-w-[1600px]">
      <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">
        {/* Left Side: Meta, Title, Content */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-semibold text-maroon-600 tracking-wider uppercase bg-maroon-50 px-3 py-1 rounded-md text-sm">
              {newsItem.category}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 mb-6 leading-tight">
            {newsItem.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm mb-10 pb-10 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{newsItem.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{newsItem.author}</span>
            </div>
          </div>
          
          <div 
            className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-600 hover:prose-a:text-maroon-800 prose-blockquote:border-l-maroon-500 prose-blockquote:bg-maroon-50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700"
            dangerouslySetInnerHTML={{ __html: newsItem.content }}
          />
        </div>

        {/* Right Side: Image */}
        <div className="sticky top-8">
          <div className="w-full aspect-square bg-gray-100 rounded-3xl flex items-center justify-center border border-gray-200 overflow-hidden shadow-2xl">
            <span className="text-gray-400 font-medium text-lg">1:1 Cover Image Placeholder</span>
          </div>
        </div>
      </div>
    </article>
  );
}
