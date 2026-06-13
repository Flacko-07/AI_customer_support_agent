"use client";

import { useEffect, useState } from "react";

interface LogEvent {
  timestamp: string;
  node: string;
  type: string;
  summary: string;
}

export default function AdminTimeline({ conversationId }: { conversationId: string }) {
  const [logs, setLogs] = useState<LogEvent[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchLogs = async () => {
      const res = await fetch(`/api/support/logs/${conversationId}`);
      const data = await res.json();
      setLogs(data.logs || []);
    };
    fetchLogs();
    interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-lg">Agent Reasoning Logs</h2>
      {logs.length === 0 && <p className="text-gray-500">No logs yet. Start a conversation.</p>}
      {logs.map((l, i) => (
        <div key={i} className="bg-white border rounded p-3 text-sm">
          <div className="text-xs text-gray-500">
            {new Date(l.timestamp).toLocaleTimeString()} · {l.node} · {l.type}
          </div>
          <div>{l.summary}</div>
        </div>
      ))}
    </div>
  );
}