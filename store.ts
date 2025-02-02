import { atom, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { client } from "@/components/client";

export const store = createStore();

type Credentials = { email: string; token: string };
export const credentialsAtom = atomWithStorage<Credentials | null>("credentials", null);

export const httpHeadersAtom = atom((get) => {
  const credentials = get(credentialsAtom);
  if (!credentials) return undefined;
  return {
    Authorization: credentials.token,
  };
});

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
