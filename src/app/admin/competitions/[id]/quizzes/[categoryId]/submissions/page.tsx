import { getQuizCategory, getQuizSubmissions, getQuizQuestions } from "../../actions";
import Link from "next/link";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

export default async function SubmissionsPage({ params }: { params: { id: string, categoryId: string } }) {
  const { id, categoryId } = await params;
  const category = await getQuizCategory(categoryId);
  const submissions = await getQuizSubmissions(categoryId);
  const questions = await getQuizQuestions(categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const timeA = a.totalTimeLeft || 0;
    const timeB = b.totalTimeLeft || 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">Submissions: {category.name}</h1>
        <Link href={`/admin/competitions/${id}/quizzes`} className="text-maroon-700/70 hover:text-maroon-800">Back to Quizzes</Link>
      </div>

      <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm overflow-hidden">
        {sortedSubmissions.length === 0 ? (
          <div className="text-center text-maroon-500 py-8">No submissions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-maroon-100 bg-maroon-50/50">
                  <th className="p-3 text-sm font-semibold text-maroon-900">Rank</th>
                  <th className="p-3 text-sm font-semibold text-maroon-900">School Name</th>
                  <th className="p-3 text-sm font-semibold text-maroon-900">Score</th>
                  <th className="p-3 text-sm font-semibold text-maroon-900">Time Saved</th>
                  <th className="p-3 text-sm font-semibold text-maroon-900">Submitted At</th>
                  <th className="p-3 text-sm font-semibold text-maroon-900 min-w-[300px]">Answers</th>
                </tr>
              </thead>
              <tbody>
                {sortedSubmissions.map((sub, index) => {
                  let rankClass = "text-gray-500 font-medium";
                  let rankText = `${index + 1}th`;
                  if (index === 0) { rankClass = "text-amber-500 font-bold"; rankText = "1st"; }
                  else if (index === 1) { rankClass = "text-slate-400 font-bold"; rankText = "2nd"; }
                  else if (index === 2) { rankClass = "text-amber-700 font-bold"; rankText = "3rd"; }
                  else if (index === 3) rankText = "4th";
                  
                  return (
                    <tr key={sub.id} className="border-b border-maroon-50 hover:bg-maroon-50/20">
                      <td className={`p-3 text-sm ${rankClass}`}>{rankText}</td>
                      <td className="p-3 text-sm text-maroon-800 font-medium">{sub.schoolName}</td>
                      <td className="p-3 text-sm text-maroon-800 font-bold">{sub.score} / {questions.length}</td>
                      <td className="p-3 text-sm text-maroon-600 font-mono">{sub.totalTimeLeft || 0}s</td>
                      <td className="p-3 text-sm text-maroon-600">{new Date(sub.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}</td>
                      <td className="p-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {questions.map((q, i) => {
                            let isCorrect = false;
                            let answered = false;
                            if (sub.answers && sub.answers[q.id] !== undefined) {
                              answered = true;
                              isCorrect = sub.answers[q.id] === q.correctOption;
                            }
                            return (
                              <div key={q.id} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${isCorrect ? 'bg-green-50 border-green-200 text-green-700' : answered ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`} title={answered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Unanswered'}>
                                <span>Q{i + 1}</span>
                                {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : answered ? <XCircle className="w-3.5 h-3.5" /> : <MinusCircle className="w-3.5 h-3.5" />}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
