import { API_BASE_URL } from "./constants";
import { queueRequest } from "./offline-queue";

export type QueueResult = { queued: true };

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string | null;
};

async function parseJson(response: Response) {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text) {
    return null;
  }
  if (contentType.includes("application/json")) {
    return JSON.parse(text) as unknown;
  }
  return text;
}

function buildQuery(
  params?: Record<string, string | number | boolean | undefined | null>
) {
  if (!params) {
    return "";
  }
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const { method = "GET", body, headers, token } = options;
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers || {})
  };
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? (data as { message: string }).message
        : "Request failed";
    const error = new Error(message);
    (error as Error & { status?: number; errors?: any }).status = response.status;
    if (typeof data === "object" && data && "errors" in data) {
      (error as Error & { status?: number; errors?: any }).errors = (data as { errors?: any }).errors;
    }
    throw error;
  }

  return data as T;
}

export async function getJson<T>(
  path: string,
  token?: string | null,
  params?: Record<string, string | number | boolean | undefined | null>
) {
  return apiFetch<T>(`${path}${buildQuery(params)}`, { token });
}

export async function postJson<T>(
  path: string,
  body: unknown,
  token?: string | null,
  options?: { queueIfOffline?: boolean }
): Promise<T | QueueResult> {
  if (
    options?.queueIfOffline &&
    typeof navigator !== "undefined" &&
    !navigator.onLine
  ) {
    queueRequest({ path, method: "POST", body });
    return { queued: true };
  }

  return apiFetch<T>(path, { method: "POST", body, token });
}
