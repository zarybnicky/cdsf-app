import { atom, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { client } from "@/components/client";
import { components } from "@/CDSF";
import { atomWithQuery } from "jotai-tanstack-query";

export const store = createStore();

type Credentials = { email: string; token: string };
const credentialsAtom = atomWithStorage<Credentials | null>(
  "credentials",
  null,
);
const httpHeadersAtom = atom((get) => ({
  Authorization: get(credentialsAtom)?.token || undefined,
}));

export const logInAtom = atom<
  boolean,
  [{ email: string; password: string } | null],
  Promise<number>
>(
  (get) => !!get(credentialsAtom),
  async (get, set, args): Promise<number> => {
    const credentials = get(credentialsAtom);

    if (!args) {
      if (!credentials) return 200;
      const response = await client.DELETE("/credentials/current", {
        headers: get(httpHeadersAtom),
        params: {
          query: {
            purpose: "Mobilní aplikace ČSTS 2.0",
          },
        },
      });

      if (response.response.status === 200) set(credentialsAtom, null);

      return response.response.status;
    } else {
      if (credentials) return 200;
      const response = await client.POST("/credentials", {
        body: {
          login: args.email,
          password: args.password,
          purpose: "Mobilní aplikace ČSTS 2.0",
        },
      });

      if (response.data) {
        set(credentialsAtom, {
          email: args.email,
          token: `Bearer ${response.data}`,
        });
      }
      return response.response.status;
    }
  },
);

export const athletesAtom = atomWithQuery<components["schemas"]["Athlete"][]>(
  (get) => ({
    queryKey: ["athletes"],
    enabled: get(logInAtom),
    async queryFn({ signal }) {
      const response = await client.GET("/athletes/current", {
        signal,
        headers: get(httpHeadersAtom),
      });
      if (response.response.status >= 300) throw response;
      return response.data?.collection || [];
    },
  }),
);

export const notificationsAtom = atomWithQuery<
  components["schemas"]["Notification"][]
>((get) => ({
  queryKey: ["notifications"],
  enabled: get(logInAtom),
  async queryFn({ signal }) {
    const response = await client.GET("/notifications", {
      signal,
      headers: get(httpHeadersAtom),
    });
    if (response.response.status >= 300) throw response;
    return response.data?.collection || [];
  },
}));

export const myRegistrationsAtom = atomWithQuery<
  components["schemas"]["EventRegistration"][]
>((get) => ({
  queryKey: ["myRegistrations"],
  enabled: get(logInAtom),
  async queryFn({ signal }) {
    const response = await client.GET("/athletes/current/competitions/registrations", {
      signal,
      headers: get(httpHeadersAtom),
    });
    if (response.response.status >= 300) throw response;
    return response.data?.collection || [];
  },
}));

// Missing in OpenAPI spec
type EventResult = {};

export const myResultsAtom = atomWithQuery<EventResult[]>(
  (get) => ({
    queryKey: ["myResults"],
    enabled: get(logInAtom),
    async queryFn({ signal }) {
      const response = await client.GET("/athletes/current/competitions/results", {
        signal,
        headers: get(httpHeadersAtom),
      });
      if (response.response.status >= 300) throw response;
      return response.data?.collection || [];
    },
  }),
);
