import pool from "@/lib/db";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { deleteMagazine } from "../actions";

export default async function MagazinesAdmin() {
  const res = await pool.query('SELECT * FROM "magazine" ORDER BY "createdAt" DESC');
  const magazines = res.rows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">Magazines</h1>
        <Link
          href="/admin/magazines/new"
          className="bg-maroon-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Magazine
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-maroon-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-maroon-50 border-b border-maroon-100 text-sm text-maroon-800">
              <th className="p-4 font-medium">Vol / Issue</th>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Date Created</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {magazines.map((mag) => (
              <tr key={mag.id} className="border-b border-maroon-50 hover:bg-maroon-50/50 transition-colors">
                <td className="p-4 font-medium text-maroon-950">Vol {mag.volumeNumber}, Issue {mag.issueNumber}</td>
                <td className="p-4 font-medium text-maroon-950">{mag.title}</td>
                <td className="p-4 text-maroon-700/80 text-sm">
                  {new Date(mag.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <Link href={`/admin/magazines/${mag.id}`} className="p-2 text-maroon-700 hover:bg-maroon-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <form action={async () => { "use server"; await deleteMagazine(mag.id); }}>
                    <button type="submit" className="p-2 text-maroon-800 hover:bg-maroon-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {magazines.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-maroon-700/60">
                  No magazines found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
