import AsyncStorage from "@react-native-async-storage/async-storage";

const storagePrefix = "seen-state";

type StoredSeenState = {
  ids: string[];
  initialized: boolean;
};

export function seenKey(
  namespace: string,
  email?: string | null,
) {
  const normalizedNamespace = namespace.trim().toLowerCase();
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail
    ? `${storagePrefix}:${normalizedNamespace}:${normalizedEmail}`
    : `${storagePrefix}:${normalizedNamespace}`;
}

export async function getSeenState(namespace: string, email?: string | null) {
  const key = seenKey(namespace, email);
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return {
      ids: new Set<string>(),
      initialized: false,
    };
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredSeenState>;

    if (!Array.isArray(parsed.ids)) {
      return {
        ids: new Set<string>(),
        initialized: false,
      };
    }

    const ids = new Set(
      parsed.ids.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    );
    const initialized =
      typeof parsed.initialized === "boolean"
        ? parsed.initialized
        : ids.size > 0;

    return {
      ids,
      initialized,
    };
  } catch {
    return {
      ids: new Set<string>(),
      initialized: false,
    };
  }
}

export async function addSeenIds(
  namespace: string,
  ids: Iterable<string | number>,
  email?: string | null,
) {
  const nextIdsToAdd = new Set(
    Array.from(ids, (id) => id.toString()).filter((id) => id.length > 0),
  );

  if (nextIdsToAdd.size === 0) {
    return nextIdsToAdd;
  }

  const key = seenKey(namespace, email);
  const current = await getSeenState(namespace, email);
  const nextIds = new Set(current.ids);

  nextIdsToAdd.forEach((id) => {
    nextIds.add(id);
  });

  if (nextIds.size === current.ids.size && current.initialized) {
    return nextIds;
  }

  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      ids: [...nextIds],
      initialized: true,
    } satisfies StoredSeenState),
  );

  return nextIds;
}

export async function dropSeenIds(
  namespace: string,
  ids: Iterable<string | number>,
  email?: string | null,
) {
  const idsToRemove = new Set(
    Array.from(ids, (id) => id.toString()).filter((id) => id.length > 0),
  );

  const key = seenKey(namespace, email);
  const current = await getSeenState(namespace, email);
  const nextIds = new Set(current.ids);

  idsToRemove.forEach((id) => {
    nextIds.delete(id);
  });

  if (nextIds.size === current.ids.size && current.initialized) {
    return nextIds;
  }

  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      ids: [...nextIds],
      initialized: true,
    } satisfies StoredSeenState),
  );

  return nextIds;
}
