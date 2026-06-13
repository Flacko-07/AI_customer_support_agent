"use client";

import { useState } from "react";
import AdminTimeline from "@/components/AdminTimeline";

export default function AdminPage() {
  const [convId, setConvId] = useState("demo-1");

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="mb-4 flex gap-2 items-center">
          <label className="text-sm font-medium">Conversation ID:</label>
          <input
            type="text"
            value={convId}
            onChange={(e) => setConvId(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            placeholder="e.g., demo-1"
          />
        </div>
        <AdminTimeline conversationId={convId} />
      </div>
    </main>
  );
}