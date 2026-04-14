import createClient from "openapi-fetch";

import type { components, paths } from "@/CDSF";

export const appPurpose = "Mobilní aplikace ČSTS 2.0";

export const fetchClient = createClient<paths>({
  baseUrl: "https://www.csts.cz/api/1",
});

export function getData<T>(
  response: {
    data?: T;
    error?: unknown;
  },
  message: string,
) {
  if (response.error) {
    throw response.error;
  }

  if (!response.data) {
    throw new Error(message);
  }

  return response.data;
}

export function pageCount(value: number) {
  return Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : Number.POSITIVE_INFINITY;
}

export const paging = {
  next(lastPage: { paging?: components["schemas"]["Paging"] } | undefined) {
    const { totalCount = 0, pageSize = 5, page = 0 } = lastPage?.paging || {};

    return totalCount > pageSize * page ? page + 1 : undefined;
  },
};
