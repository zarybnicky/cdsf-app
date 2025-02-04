import { atom, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { client } from "@/components/client";

export const store = createStore();

type Credentials = { email: string; token: string };
export const credentialsAtom = atomWithStorage<Credentials | null>("credentials", null);

type NotificationPrefs = {
  adjudicatorsMessage: boolean;
  clubRepresentativeMessage: boolean;
  clubTransferCompletion: boolean;
  competitionChange: boolean;
  competitionMessage: boolean;
  competitionRegistrationEndChange: boolean;
  divisionRepresentativeMessage: boolean;
  executiveBoardMinutes: boolean;
  medicalCheckupExpiration: boolean;
  officialsMessage: boolean;
}
export const notificationPrefsAtom = atomWithStorage<NotificationPrefs>("notificationPrefs", {
  adjudicatorsMessage: true,
  clubRepresentativeMessage: true,
  clubTransferCompletion: true,
  competitionChange: true,
  competitionMessage: true,
  competitionRegistrationEndChange: true,
  divisionRepresentativeMessage: true,
  executiveBoardMinutes: true,
  medicalCheckupExpiration: true,
  officialsMessage: true,
})

export const httpHeadersAtom = atom((get) => {
  const credentials = get(credentialsAtom);
  if (!credentials) return undefined;
  return {
    Authorization: credentials.token,
  };
});

export const logInAtom = atom(
  null,
  async (get, set, args: { email: string; password: string; }): Promise<number> => {
    const credentials = get(credentialsAtom);

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
  },
);

export const logOutAtom = atom(
  null,
  async (get, set): Promise<number> => {
    const credentials = get(credentialsAtom);
    set(credentialsAtom, null);

    if (!credentials) return 200;
    const response = await client.DELETE("/credentials/current", {
      headers: get(httpHeadersAtom),
      params: {
        query: {
          purpose: "Mobilní aplikace ČSTS 2.0",
        },
      },
    });

    return response.response.status;
  },
);
