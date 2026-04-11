import type { Href } from "expo-router";

import type { Session } from "@/lib/session";

export const loginHref = "/login" as const satisfies Href;
export const announcementsHref = "/announcements" as const satisfies Href;

export function getAppEntryHref(session: Session | null | undefined) {
  return session ? announcementsHref : loginHref;
}
