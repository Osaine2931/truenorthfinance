export type SystemLogCategory = "smtp" | "nowpayments" | "auth" | "api" | "database" | "webhook" | "system";
export type SystemLogLevel = "info" | "warn" | "error";

export type SystemLogEntry = {
  id: string;
  timestamp: string;
  category: SystemLogCategory;
  level: SystemLogLevel;
  message: string;
  details?: Record<string, unknown>;
};

const MAX_LOGS = 500;
const globalLogStore = globalThis as typeof globalThis & {
  __tnfSystemLogs?: SystemLogEntry[];
};

function getLogStore() {
  if (!globalLogStore.__tnfSystemLogs) {
    globalLogStore.__tnfSystemLogs = [];
  }
  return globalLogStore.__tnfSystemLogs;
}

export function appendSystemLog(entry: Omit<SystemLogEntry, "id" | "timestamp">) {
  const store = getLogStore();
  store.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (store.length > MAX_LOGS) {
    store.splice(0, store.length - MAX_LOGS);
  }
  return store[store.length - 1];
}

export function getSystemLogs(limit = 200): SystemLogEntry[] {
  return getLogStore().slice(-limit).reverse();
}

export function clearSystemLogs() {
  getLogStore().length = 0;
}

export function exportSystemLogs() {
  return JSON.stringify(getSystemLogs(500), null, 2);
}
