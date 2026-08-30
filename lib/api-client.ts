import { API_BASE_URL } from "./constants";
import { queueRequest } from "./offline-queue";
import { ApiResponse } from "./types";
import api from "./axiosInstance";
import { AxiosRequestConfig } from "axios";

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

  const config: AxiosRequestConfig = {
    method,
    url: path,
    headers: headers || {},
  };

  if (body !== undefined) {
    config.data = body;
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      config.headers = { ...config.headers };
      delete config.headers["Content-Type"];
    }
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }

  try {
    const response = await api.request(config);
    return response.data as T;
  } catch (error: any) {
    const responseData = error.response?.data;
    const message =
      typeof responseData === "object" && responseData && "message" in responseData
        ? (responseData as { message: string }).message
        : error.message || "Request failed";
    
    const enhancedError = new Error(message);
    (enhancedError as Error & { status?: number; errors?: any }).status = error.response?.status;
    if (typeof responseData === "object" && responseData && "errors" in responseData) {
      (enhancedError as Error & { status?: number; errors?: any }).errors = (responseData as { errors?: any }).errors;
    }
    throw enhancedError;
  }
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
