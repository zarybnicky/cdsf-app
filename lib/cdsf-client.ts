import createClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";

import type { components, paths } from "@/CDSF";

export const cdsfAppPurpose = "Mobilní aplikace ČSTS 2.0";
const cdsfBaseUrl = "https://www.csts.cz/api/1";

export const fetchClient = createClient<paths>({
  baseUrl: cdsfBaseUrl,
});

export const openapiClient = createQueryClient<paths>(fetchClient);

export const isPagingProps = {
  pageParamName: "page",
  initialPageParam: 1,
  getNextPageParam(
    lastPage: { paging?: components["schemas"]["Paging"] } | undefined,
  ) {
    const { totalCount = 0, pageSize = 5, page = 0 } = lastPage?.paging || {};

    return totalCount > pageSize * page ? page + 1 : undefined;
  },
};
