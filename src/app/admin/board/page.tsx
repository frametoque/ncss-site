import pool from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteExecutiveBoardMember, updateBoardOrder } from "../actions";
import { SortableTable } from "@/components/admin/SortableTable";

export default async function BoardAdmin() {
  const res = await pool.query('SELECT * FROM "executiveBoard" ORDER BY "orderIndex" ASC');
  const members = res.rows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">Executive Board</h1>
        <Link
          href="/admin/board/new"
          className="bg-maroon-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Board Member
        </Link>
      </div>

      <SortableTable 
        items={members} 
        columns={[
          { key: "name", label: "Name" },
          { key: "role", label: "Role" }
        ]} 
        basePath="/admin/board" 
        onReorder={updateBoardOrder} 
        onDelete={deleteExecutiveBoardMember} 
      />
    </div>
  );
}
