const cache = new Map();

export async function loadJSON(path) {
  if (!path) {
    throw new Error('Path is required to load JSON.');
  }

  if (cache.has(path)) {
    return cache.get(path);
  }

  const url = new URL(path, import.meta.url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(path, data);
    return data;
  } catch (error) {
    if (url.protocol === 'file:') {
      const { readFile } = await import('node:fs/promises');
      const text = await readFile(url, 'utf-8');
      const data = JSON.parse(text);
      cache.set(path, data);
      return data;
    }
    throw error;
  }
}

export function clearJSONCache() {
  cache.clear();
}
