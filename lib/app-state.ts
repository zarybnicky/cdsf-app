import { notificationPreferencesAtom } from "@/lib/notification-preferences";
import { clearCache } from "@/lib/react-query";
import { clearSeenState } from "@/lib/seen-state";
import { appStore } from "@/lib/app-store";
import { RESET } from "jotai/utils";

export async function clearAuthenticatedAppState() {
  await Promise.all([
    clearCache(),
    appStore.set(notificationPreferencesAtom, RESET),
    clearSeenState(),
  ]);
}
