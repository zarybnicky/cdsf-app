import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { AppState, type NativeEventSubscription } from "react-native";
import { prepareNotifications } from "./notify";
import { sync } from "./sync";

const BACKGROUND_TASK = "fed-sync";

let enabled: boolean | undefined;
let foregroundSubscription: NativeEventSubscription | null = null;
let backgroundTaskUpdate: Promise<void> = Promise.resolve();

if (!TaskManager.isTaskDefined(BACKGROUND_TASK)) {
  TaskManager.defineTask(BACKGROUND_TASK, async () => {
    try {
      await sync({ trigger: "background" });
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export function setAuthenticatedSyncEnabled(nextEnabled: boolean): void {
  if (enabled === nextEnabled) return;
  enabled = nextEnabled;

  foregroundSubscription?.remove();
  foregroundSubscription = null;

  if (!nextEnabled) {
    setBackgroundTaskEnabled(false);
    return;
  }

  prepareNotifications().catch(() => {});
  sync({ trigger: "initial" }).catch(() => {});
  foregroundSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      prepareNotifications().catch(() => {});
      sync({ trigger: "foreground" }).catch(() => {});
    }
  });
  setBackgroundTaskEnabled(true);
}

function setBackgroundTaskEnabled(nextEnabled: boolean): void {
  backgroundTaskUpdate = backgroundTaskUpdate
    .then(() =>
      nextEnabled
        ? BackgroundTask.registerTaskAsync(BACKGROUND_TASK, {
            minimumInterval: 15,
          })
        : BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK),
    )
    .catch(() => {});
}
