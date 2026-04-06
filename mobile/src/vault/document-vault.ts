import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

export type VaultDocType = 'FMB Sketch' | 'Patta' | 'EC' | 'GIS Snapshot';
export type VaultDoc = {
  id: string;
  parcelId: string;
  type: VaultDocType;
  name: string;
  uri: string;
  mimeType?: string | null;
  size?: number | null;
  uploadedAt: string;
};

const KEY = 'landroid_vault_docs_v1';
const ROOT = `${FileSystem.cacheDirectory}landroid_vault_v1/`;

export async function listVaultDocs(parcelId: string) {
  const data = await SecureStore.getItemAsync(KEY);
  const all: VaultDoc[] = data ? JSON.parse(data) : [];
  return all.filter((d) => d.parcelId === parcelId);
}

export async function addVaultDoc(input: Omit<VaultDoc, 'id' | 'uploadedAt' | 'uri'> & { sourceUri: string }) {
  const data = await SecureStore.getItemAsync(KEY);
  const all: VaultDoc[] = data ? JSON.parse(data) : [];
  const id = `doc_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const dirInfo = await FileSystem.getInfoAsync(ROOT);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
  const targetUri = `${ROOT}${id}_${input.name.replace(/\s+/g, '_')}`;
  await FileSystem.copyAsync({ from: input.sourceUri, to: targetUri });

  const doc: VaultDoc = {
    id,
    parcelId: input.parcelId,
    type: input.type,
    name: input.name,
    uri: targetUri,
    mimeType: input.mimeType,
    size: input.size,
    uploadedAt: new Date().toISOString(),
  };
  all.push(doc);
  await SecureStore.setItemAsync(KEY, JSON.stringify(all));
  return doc;
}

export async function removeVaultDoc(id: string) {
  const data = await SecureStore.getItemAsync(KEY);
  const all: VaultDoc[] = data ? JSON.parse(data) : [];
  const found = all.find((d) => d.id === id);
  if (found) {
    try {
      await FileSystem.deleteAsync(found.uri, { idempotent: true });
    } catch {}
  }
  const next = all.filter((d) => d.id !== id);
  await SecureStore.setItemAsync(KEY, JSON.stringify(next));
}

export function createShareLink(doc: VaultDoc) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const token = `${doc.id}_${Math.random().toString(36).slice(2, 10)}`;
  return { url: `landroid://vault/share?token=${token}`, expiresAt };
}

