// lib/logs.ts
const logStore = new Map<string, any[]>();

export function addLogs(conversationId: string, newLogs: any[]) {
  const existing = logStore.get(conversationId) || [];
  logStore.set(conversationId, [...existing, ...newLogs]);
}

export function getLogs(conversationId: string) {
  return logStore.get(conversationId) || [];
}