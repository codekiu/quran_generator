import { useEffect, useRef, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

const resolveDefaultValue = (defaultValue) =>
  typeof defaultValue === 'function' ? defaultValue() : defaultValue;

const getStorage = (customStorage) => {
  if (!isBrowser) {
    return null;
  }

  try {
    return customStorage ?? window.localStorage;
  } catch (err) {
    console.warn('[usePersistentState] Unable to access storage:', err);
    return null;
  }
};

const readStoredValue = (store, key, fallback, deserializer) => {
  if (!store) {
    return fallback;
  }

  try {
    const storedValue = store.getItem(key);
    return storedValue == null ? fallback : deserializer(storedValue);
  } catch (err) {
    console.warn(`[usePersistentState] Failed to read "${key}":`, err);
    return fallback;
  }
};

const usePersistentState = (key, defaultValue, options = {}) => {
  const { storage, serializer = JSON.stringify, deserializer = JSON.parse } = options;
  const storageRef = useRef(null);

  if (storageRef.current === null) {
    storageRef.current = getStorage(storage);
  }

  const [state, setState] = useState(() => {
    const fallback = resolveDefaultValue(defaultValue);
    return readStoredValue(storageRef.current, key, fallback, deserializer);
  });

  useEffect(() => {
    const store = storageRef.current;
    if (!store) {
      return;
    }

    try {
      if (state === undefined) {
        store.removeItem(key);
      } else {
        store.setItem(key, serializer(state));
      }
    } catch (err) {
      console.warn(`[usePersistentState] Failed to write "${key}":`, err);
    }
  }, [key, serializer, state]);

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.storageArea !== storageRef.current) {
        return;
      }

      if (event.key !== key) {
        return;
      }

      try {
        if (event.newValue == null) {
          setState(resolveDefaultValue(defaultValue));
        } else {
          setState(deserializer(event.newValue));
        }
      } catch (err) {
        console.warn(`[usePersistentState] Failed to sync "${key}" from storage event:`, err);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [defaultValue, deserializer, key]);

  return [state, setState];
};

export default usePersistentState;
