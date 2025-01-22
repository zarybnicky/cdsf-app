import createClient from "openapi-fetch";
import type { paths } from "@/CDSF";

export const client = createClient<paths>({ baseUrl: "https://www.csts.cz/api/1" });
