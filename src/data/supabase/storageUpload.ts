import * as FileSystem from 'expo-file-system/legacy';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const base64ToUint8Array = (base64: string) => {
  const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const output: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (let index = 0; index < sanitized.length; index += 1) {
    const char = sanitized.charAt(index);
    if (char === '=') {
      break;
    }
    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      output.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return new Uint8Array(output);
};

export const readUploadBytes = async (uri: string) => {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return base64ToUint8Array(base64);
};
