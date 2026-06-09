import { API_BASE_URL } from "./constants";
import { queueRequest } from "./offline-queue";
import { ApiResponse } from "./types";

export type QueueResult = { queued: true };

export type ApiDataWithMeta<T> = {
  data: T;
  meta: ApiResponse<T>["meta"];
};

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

/** True when the backend returned `{ success, data, ... }`. */
export function isApiEnvelope(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    (value as ApiResponse<unknown>).success === true
  );
}

/** Unwrap `{ success, data }` → `data`. Passes through already-unwrapped values. */
export function unwrapApiData<T>(response: unknown): T {
  if (isApiEnvelope(response)) {
    return response.data as T;
  }
  return response as T;
}

/** Unwrap envelope and preserve top-level `meta` (pagination, cursor, etc.). */
export function unwrapApiDataWithMeta<T>(response: unknown): ApiDataWithMeta<T> {
  if (isApiEnvelope(response)) {
    return { data: response.data as T, meta: response.meta ?? null };
  }
  return { data: response as T, meta: null };
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

/** GET helper — returns unwrapped `data` from the standard API envelope. */
export async function getJson<T>(
  path: string,
  token?: string | null,
  params?: Record<string, string | number | boolean | undefined | null>
) {
  const raw = await apiFetch<unknown>(`${path}${buildQuery(params)}`, { token });
  return unwrapApiData<T>(raw);
}

/** GET helper — returns `{ data, meta }` when pagination/cursor meta is needed. */
export async function getJsonWithMeta<T>(
  path: string,
  token?: string | null,
  params?: Record<string, string | number | boolean | undefined | null>
) {
  const raw = await apiFetch<unknown>(`${path}${buildQuery(params)}`, { token });
  return unwrapApiDataWithMeta<T>(raw);
}

/** Mutation helper — returns unwrapped `data` from the standard API envelope. */
export async function apiFetchData<T>(path: string, options: ApiOptions = {}) {
  const raw = await apiFetch<unknown>(path, options);
  return unwrapApiData<T>(raw);
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

  const raw = await apiFetch<unknown>(path, { method: "POST", body, token });
  return unwrapApiData<T>(raw);
}
