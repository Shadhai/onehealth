const DB_NAME = "onehealth-lens";
const STORE_NAME = "pending-observations";
const FALLBACK_KEY = "ohl-pending-observations";

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "submission_id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fallbackRead() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || "[]");
  } catch {
    return [];
  }
}

function fallbackWrite(items) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  return items;
}

export async function listPendingObservations() {
  if (!hasIndexedDb()) return fallbackRead();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueObservation(observation) {
  if (!hasIndexedDb()) {
    const result = fallbackWrite([...fallbackRead(), observation]);
    registerBackgroundSync();
    return result;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(observation);
    request.onsuccess = () => {
      registerBackgroundSync();
      resolve(observation);
    };
    request.onerror = () => reject(request.error);
  });
}

export function registerBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) => registration.sync?.register("onehealth-observations"))
    .catch(() => {});
}

export async function clearPendingObservations(ids) {
  if (!hasIndexedDb()) {
    const remaining = fallbackRead().filter((item) => !ids.includes(item.submission_id));
    fallbackWrite(remaining);
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    ids.forEach((id) => tx.objectStore(STORE_NAME).delete(id));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
