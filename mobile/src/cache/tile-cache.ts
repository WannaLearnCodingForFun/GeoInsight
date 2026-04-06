import * as FileSystem from 'expo-file-system/legacy';

const ROOT = `${FileSystem.cacheDirectory}landroid_tiles_v1/`;

export async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(ROOT);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
}

export async function clearTileCache() {
  const info = await FileSystem.getInfoAsync(ROOT);
  if (info.exists) {
    await FileSystem.deleteAsync(ROOT, { idempotent: true });
  }
}

export async function getTileCacheSizeBytes(): Promise<number> {
  const info = await FileSystem.getInfoAsync(ROOT);
  if (!info.exists) return 0;
  // Expo doesn't expose recursive dir size directly; this is a lightweight placeholder.
  // When you start downloading tiles, track bytes written in a separate counter file.
  return 0;
}

