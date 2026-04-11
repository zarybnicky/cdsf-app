import AsyncStorage from "@react-native-async-storage/async-storage";

const seenStateStoragePrefix = "seen-state";

type StoredSeenState = {
  ids: string[];
};

function normalizeSeenIds(ids: Iterable<string>) {
  return Array.from(new Set(ids));
}

export function getSeenStateStorageKey(
  namespace: string,
  email?: string | null,
) {
  const normalizedNamespace = namespace.trim().toLowerCase();
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail
    ? `${seenStateStoragePrefix}:${normalizedNamespace}:${normalizedEmail}`
    : `${seenStateStoragePrefix}:${normalizedNamespace}`;
}

async function readStoredSeenState(key: string) {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredSeenState>;

    if (!Array.isArray(parsed.ids)) {
      return null;
    }

    return {
      ids: normalizeSeenIds(
        parsed.ids.filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        ),
      ),
    };
  } catch {
    return null;
  }
}

export async function getStoredSeenIds(
  namespace: string,
  email?: string | null,
) {
  const storedState = await readStoredSeenState(
    getSeenStateStorageKey(namespace, email),
  );
  return storedState?.ids || [];
}

export async function markSeenIds(
  namespace: string,
  ids: Iterable<string | number>,
  email?: string | null,
) {
  const normalizedIds = normalizeSeenIds(
    Array.from(ids, (id) => id.toString()).filter((id) => id.length > 0),
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const storageKey = getSeenStateStorageKey(namespace, email);
  const existingIds = await getStoredSeenIds(namespace, email);
  const nextIds = normalizeSeenIds([...existingIds, ...normalizedIds]);

  if (nextIds.length === existingIds.length) {
    return nextIds;
  }

  await AsyncStorage.setItem(
    storageKey,
    JSON.stringify({
      ids: nextIds,
    } satisfies StoredSeenState),
  );

  return nextIds;
}

export function filterUnseenItems<T>(
  items: readonly T[],
  seenIds: readonly string[],
  getId: (item: T) => string,
) {
  const seenIdsSet = new Set(seenIds);
  return items.filter((item) => !seenIdsSet.has(getId(item)));
}
