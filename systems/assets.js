import { loadJSON } from './jsonLoader.js';

let libraryPromise;

function normaliseEntry(group, entry) {
  const width = entry.width ?? 128;
  const height = entry.height ?? 128;
  const palette = entry.palette ?? ['#0f1e3c', '#0353a4'];
  const label = entry.label ?? entry.id ?? 'Asset';

  return {
    id: entry.id ?? `${group}-${label.toLowerCase().replace(/\s+/g, '-')}`,
    group,
    label,
    description: entry.description ?? '',
    width,
    height,
    palette,
    src: entry.src ?? null,
  };
}

function encodeSVG(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function generatePlaceholder({ width, height, label, palette }) {
  const [primary, secondary] = palette;
  const textColor = palette[2] ?? '#ffffff';
  const fontSize = Math.max(12, Math.floor(Math.min(width, height) / 6));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs>` +
    `<pattern id="checker" width="12" height="12" patternUnits="userSpaceOnUse">` +
    `<rect width="12" height="12" fill="${secondary}"/>` +
    `<rect width="6" height="6" fill="${primary}"/>` +
    `<rect x="6" y="6" width="6" height="6" fill="${primary}"/>` +
    `</pattern>` +
    `</defs>` +
    `<rect width="${width}" height="${height}" fill="url(#checker)"/>` +
    `<rect width="${width}" height="${height}" fill="rgba(0,0,0,0.2)"/>` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"` +
    ` font-family="'Atkinson Hyperlegible', 'Segoe UI', sans-serif" font-size="${fontSize}" fill="${textColor}"` +
    `>${label.replace(/</g, '&lt;')}</text>` +
    `</svg>`;

  return encodeSVG(svg);
}

async function buildLibrary() {
  const manifest = await loadJSON('../data/manifest.json');
  const entries = new Map();
  const groups = new Map();

  Object.entries(manifest).forEach(([group, items]) => {
    if (!Array.isArray(items)) {
      return;
    }

    const normalisedItems = items.map((item) => {
      const meta = normaliseEntry(group, item);
      const placeholder = generatePlaceholder(meta);
      return {
        ...meta,
        placeholder,
      };
    });

    normalisedItems.forEach((meta) => {
      entries.set(meta.id, meta);
    });

    groups.set(group, normalisedItems);
  });

  return {
    manifest,
    entries,
    groups,
  };
}

async function ensureLibrary() {
  if (!libraryPromise) {
    libraryPromise = buildLibrary();
  }
  return libraryPromise;
}

export async function getAssetMeta(id) {
  const library = await ensureLibrary();
  return library.entries.get(id) ?? null;
}

export async function getAssetSource(id) {
  const meta = await getAssetMeta(id);
  if (!meta) {
    return generatePlaceholder({
      width: 160,
      height: 120,
      label: id,
      palette: ['#6c757d', '#343a40', '#ffffff'],
    });
  }

  return meta.src ?? meta.placeholder;
}

export async function listAssets(group) {
  const library = await ensureLibrary();
  if (!group) {
    return Array.from(library.entries.values());
  }
  return library.groups.get(group) ?? [];
}

export async function resolveAsset(id) {
  const meta = await getAssetMeta(id);
  if (!meta) {
    return {
      id,
      label: id,
      src: await getAssetSource(id),
      width: 160,
      height: 120,
    };
  }

  return {
    ...meta,
    src: await getAssetSource(id),
  };
}

export async function getManifest() {
  const library = await ensureLibrary();
  return library.manifest;
}

export const Assets = {
  get: resolveAsset,
  list: listAssets,
  manifest: getManifest,
};
