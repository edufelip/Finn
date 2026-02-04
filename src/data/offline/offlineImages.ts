import * as FileSystem from 'expo-file-system/legacy';

const OFFLINE_IMAGE_DIR = `${FileSystem.documentDirectory ?? ''}offline-images`;

function normalizeExtension(uri: string) {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (!extension) return '';
  return extension === 'jpeg' ? 'jpg' : extension;
}

export async function persistOfflineImage(uri: string): Promise<string> {
  if (!uri) return uri;
  if (!FileSystem.documentDirectory) return uri;
  if (uri.startsWith(FileSystem.documentDirectory)) return uri;

  try {
    await FileSystem.makeDirectoryAsync(OFFLINE_IMAGE_DIR, { intermediates: true });
    const extension = normalizeExtension(uri);
    const suffix = Math.random().toString(36).slice(2);
    const fileName = `${Date.now()}-${suffix}${extension ? `.${extension}` : ''}`;
    const destination = `${OFFLINE_IMAGE_DIR}/${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch {
    return uri;
  }
}
