import { API_BASE_URL } from "./constants";

export type QueuedRequest = {
  id: string;
  path: string;
  method: "POST" | "PUT" | "PATCH";
  body: unknown;
  createdAt: string;
};

const STORAGE_KEY = "outlet-offline-queue";

function getId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadQueue() {
  if (typeof window === "undefined") {
    return [] as QueuedRequest[];
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [] as QueuedRequest[];
  }
  try {
    return JSON.parse(raw) as QueuedRequest[];
  } catch {
    return [] as QueuedRequest[];
  }
}

function saveQueue(queue: QueuedRequest[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function queueRequest(request: Omit<QueuedRequest, "id" | "createdAt">) {
  if (typeof window === "undefined") {
    return;
  }
  const queue = loadQueue();
  queue.push({
    ...request,
    id: getId(),
    createdAt: new Date().toISOString()
  });
  saveQueue(queue);
}

export function getQueueSize() {
  return loadQueue().length;
}

export async function flushOfflineQueue(token: string | null) {
  if (!token || typeof window === "undefined") {
    return { flushed: 0, remaining: getQueueSize() };
  }
  const queue = loadQueue();
  if (!queue.length) {
    return { flushed: 0, remaining: 0 };
  }

  const remaining: QueuedRequest[] = [];

  for (const request of queue) {
    try {
      const response = await fetch(`${API_BASE_URL}${request.path}`, {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(request.body)
      });
      if (!response.ok) {
        throw new Error("Failed to sync");
      }
    } catch {
      remaining.push(request);
    }
  }

  saveQueue(remaining);
  return { flushed: queue.length - remaining.length, remaining: remaining.length };
}
