import { HistoryItem } from '../components/HistoryTab';

const HISTORY_STORAGE_KEY = 'image_compressor_history_v1';
const MAX_HISTORY_ITEMS = 10;

/**
 * Loads up to 10 history items from localStorage
 */
export function loadHistoryFromStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_HISTORY_ITEMS);
    }
  } catch (err) {
    console.warn('Failed to load history from localStorage:', err);
  }
  return [];
}

/**
 * Safely saves history items to localStorage with fallback for quota limits
 */
export function saveHistoryToStorage(items: HistoryItem[]): void {
  const limited = items.slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limited));
  } catch (err) {
    console.warn('Quota exceeded while saving history, trimming items...', err);
    // If quota exceeded, try saving fewer items (e.g. 5, then 3, then 1)
    const fallbackCounts = [5, 3, 2, 1];
    for (const count of fallbackCounts) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limited.slice(0, count)));
        return;
      } catch {
        continue;
      }
    }
  }
}

/**
 * Adds or updates an item in history, keeping at most MAX_HISTORY_ITEMS
 */
export function addOrUpdateHistoryItem(
  item: HistoryItem,
  currentHistory: HistoryItem[]
): HistoryItem[] {
  // If an item with the same id exists, replace it
  const existingIndex = currentHistory.findIndex((h) => h.id === item.id);
  let updated: HistoryItem[];

  if (existingIndex >= 0) {
    updated = [...currentHistory];
    updated[existingIndex] = item;
  } else {
    // Check if an item with the exact same name and timestamp within 10 seconds exists (deduplication)
    const recentDuplicateIndex = currentHistory.findIndex(
      (h) => h.name === item.name && Math.abs(h.timestamp - item.timestamp) < 10000
    );
    if (recentDuplicateIndex >= 0) {
      updated = [...currentHistory];
      updated[recentDuplicateIndex] = item;
    } else {
      updated = [item, ...currentHistory];
    }
  }

  const sliced = updated.slice(0, MAX_HISTORY_ITEMS);
  saveHistoryToStorage(sliced);
  return sliced;
}

/**
 * Deletes a single item by id from history
 */
export function deleteHistoryItem(id: string, currentHistory: HistoryItem[]): HistoryItem[] {
  const updated = currentHistory.filter((item) => item.id !== id);
  saveHistoryToStorage(updated);
  return updated;
}

/**
 * Clears all history from localStorage
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear history:', err);
  }
}
