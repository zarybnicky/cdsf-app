import { atom, createStore, Getter } from 'jotai';
import { atomWithRefresh, atomWithStorage, unwrap } from 'jotai/utils';
import { client } from "@/components/client";
import { components } from "@/CDSF";

function atomWithQuery<ReturnValue>(fn: (get: Getter, signal?: AbortSignal) => Promise<ReturnValue>) {
  const dataAtom = atomWithRefresh((get, { signal }) => fn(get, signal))
  dataAtom.onMount = (refresh) => void refresh()

  const cacheAtom = unwrap(dataAtom, (prev) => prev)

  return atom(
    (get) => get(cacheAtom) ?? get(dataAtom),
    (_get, set) => set(dataAtom)
  )
}

export const store = createStore();

type Credentials = { email: string; token: string; };
const credentialsAtom = atomWithStorage<Credentials | null>('credentials', null);
const httpHeadersAtom = atom((get) => ({
  Authorization: get(credentialsAtom)?.token || undefined,
}));

export const logInAtom = atom<boolean, [{ email: string, password: string } | null], Promise<number>>(
  (get) => !!get(credentialsAtom),
  async (get, set, args): Promise<number> => {
    const credentials = get(credentialsAtom)

    if (!args) {
      if (!credentials) return 200;
      const response = await client.DELETE('/credentials/current', {
        headers: get(httpHeadersAtom),
        params: {
          query: {
            purpose: 'Mobilní aplikace ČSTS 2.0',
          }
        },
      });

      if (response.response.status === 200)
        set(credentialsAtom, null);

      return response.response.status;
    } else {
      if (credentials) return 200;
      const response = await client.POST("/credentials", {
        body: {
          login: args.email,
          password: args.password,
          purpose: "Mobilní aplikace ČSTS 2.0"
        },
      });

      if (response.data) {
        set(credentialsAtom, { email: args.email, token: `Bearer ${response.data}` });
      }
      return response.response.status;
    }
  }
);

export const athletesAtom = atomWithQuery<components['schemas']['Athlete'][]>(
  async (get, signal) => {
    if (!get(credentialsAtom)) return [];

    const response = await client.GET('/athletes/current', {
      signal,
      headers: get(httpHeadersAtom),
    });
    return response.data?.collection || [];
  }
);

export const notificationsAtom = atomWithQuery<components['schemas']['Notification'][]>(
  async (get, signal) => {
    if (!get(credentialsAtom)) return [];

    const response = await client.GET('/notifications', {
      signal,
      headers: get(httpHeadersAtom),
    });
    return response.data?.collection || [];
  }
);

export const myRegistrationsAtom = atomWithQuery<components['schemas']['EventRegistration'][]>(
  async (get, signal) => {
    if (!get(credentialsAtom)) return [];

    const response = await client.GET('/athletes/current/competitions/registrations', {
      signal,
      headers: get(httpHeadersAtom),
    });
    return response.data?.collection || [];
  }
);

// Missing in OpenAPI spec
type EventResult = {

}

export const myResultsAtom = atomWithQuery<EventResult[]>(
  async (get, signal) => {
    if (!get(credentialsAtom)) return [];

    const response = await client.GET('/athletes/current/competitions/results', {
      signal,
      headers: get(httpHeadersAtom),
    });
    return response.data?.collection || [];
  }
);
