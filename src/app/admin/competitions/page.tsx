import pool from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteCompetition, updateCompetitionsOrder } from "../actions";
import { SortableTable } from "@/components/admin/SortableTable";

export default async function CompetitionsAdmin() {
  const res = await pool.query('SELECT * FROM "competition" ORDER BY "orderIndex" ASC NULLS LAST, "createdAt" DESC');
  
  const competitions = res.rows.map(comp => ({
    ...comp,
    statusText: comp.isEnded ? "Ended" : "Active"
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">Competitions</h1>
        <Link
          href="/admin/competitions/new"
          className="bg-maroon-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-900 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Competition
        </Link>
      </div>

      <SortableTable 
        items={competitions} 
        columns={[
          { key: "title", label: "Title" },
          { key: "statusText", label: "Status" }
        ]} 
        basePath="/admin/competitions" 
        onReorder={updateCompetitionsOrder} 
        onDelete={deleteCompetition} 
        showQuizzesLink={true}
      />
    </div>
  );
}
