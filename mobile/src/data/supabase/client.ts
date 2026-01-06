import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import env from '../../config/env';

const supabaseBaseUrl = env.supabaseUrl.replace(/\/$/, '');
let requestCounter = 0;

const describeBody = async (body: unknown) => {
  if (body == null) return null;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof FormData) {
    const keys = Array.from(body.keys());
    return `[FormData keys=${keys.join(', ')}]`;
  }
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return `[Blob size=${body.size} type=${body.type || 'unknown'}]`;
  }
  if (body instanceof ArrayBuffer) {
    return `[ArrayBuffer byteLength=${body.byteLength}]`;
  }
  if (typeof body === 'object') {
    try {
      return JSON.stringify(body);
    } catch {
      return '[Unserializable body]';
    }
  }
  return String(body);
};

const readRequestBody = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.body !== undefined) {
    return describeBody(init.body);
  }
  if (typeof input !== 'string' && !(input instanceof URL) && 'clone' in input) {
    try {
      return await input.clone().text();
    } catch {
      return null;
    }
  }
  return null;
};

const readResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const shouldReadText =
    contentType.includes('application/json') ||
    contentType.includes('application/vnd.pgrst') ||
    contentType.includes('application/problem+json') ||
    contentType.startsWith('text/');

  if (!shouldReadText) {
    return `[${contentType || 'unknown content-type'}]`;
  }

  try {
    return await response.clone().text();
  } catch {
    return '[Unreadable response body]';
  }
};

const readStorageResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const shouldReadText =
    contentType.includes('application/json') || contentType.includes('application/problem+json');

  if (!shouldReadText) {
    return null;
  }

  try {
    return await response.clone().text();
  } catch {
    return '[Unreadable response body]';
  }
};

const loggedFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const isSupabaseRequest = url.startsWith(supabaseBaseUrl);
  const isStorageRequest = url.startsWith(`${supabaseBaseUrl}/storage/v1/`);
  const isDatabaseRequest =
    url.startsWith(`${supabaseBaseUrl}/rest/v1/`) || url.startsWith(`${supabaseBaseUrl}/graphql/v1/`);
  if (!__DEV__ || !isSupabaseRequest) {
    return fetch(input, init);
  }

  const requestId = ++requestCounter;
  const method =
    init?.method ??
    (typeof input === 'string' || input instanceof URL ? 'GET' : input.method);
  const startedAt = Date.now();
  const requestBody = isDatabaseRequest ? await readRequestBody(input, init) : null;

  // Debug-only logging; headers intentionally omitted.
  const requestLabel = isDatabaseRequest ? 'db' : isStorageRequest ? 'storage' : 'other';
  if (requestBody) {
    console.log(`[Supabase][${requestLabel}][${requestId}] → ${method} ${url}`, { body: requestBody });
  } else {
    console.log(`[Supabase][${requestLabel}][${requestId}] → ${method} ${url}`);
  }

  try {
    const response = await fetch(input, init);
    const durationMs = Date.now() - startedAt;
    const responseBody = isDatabaseRequest
      ? await readResponseBody(response)
      : isStorageRequest
        ? await readStorageResponseBody(response)
        : null;
    if (responseBody !== null) {
      console.log(
        `[Supabase][${requestLabel}][${requestId}] ← ${response.status} ${response.statusText} (${durationMs}ms) ${url}`,
        { body: responseBody }
      );
    } else {
      console.log(
        `[Supabase][${requestLabel}][${requestId}] ← ${response.status} ${response.statusText} (${durationMs}ms) ${url}`
      );
    }
    return response;
  } catch (error) {
    console.log(`[Supabase][${requestLabel}][${requestId}] ← ERROR ${url}`, error);
    throw error;
  }
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  global: {
    fetch: loggedFetch,
  },
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
