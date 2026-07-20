import createClient from "openapi-fetch";

import type { paths } from "@/CDSF";

export const API_BASE_URL = "https://www.csts.cz/api/1";

export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});

export class ApiError extends Error {
  readonly details: unknown;
  readonly response: Response;
  readonly status: number;
  readonly url: string;

  constructor(response: Response, details: unknown) {
    const description = formatErrorDetails(details);
    const status = [response.status, response.statusText]
      .filter(Boolean)
      .join(" ");
    const location = response.url ? ` ${response.url}` : "";
    super(
      `API request failed (${status})${location}${description ? `: ${description}` : ""}`,
      { cause: details },
    );
    this.name = "ApiError";
    this.details = details;
    this.response = response;
    this.status = response.status;
    this.url = response.url;
  }
}

function formatErrorDetails(details: unknown): string | undefined {
  if (details === undefined) return undefined;
  if (details instanceof Error) return details.message;
  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

type ApiResponse<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

export async function fetchData<T>(
  request: Promise<ApiResponse<T>>,
): Promise<T> {
  const { data, error, response } = await request;

  if (error !== undefined || data === undefined) {
    throw new ApiError(response, error);
  }

  return data;
}
