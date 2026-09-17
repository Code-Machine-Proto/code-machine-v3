import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : String(input);
  if (url.startsWith('file://') && url.endsWith('.wasm')) {
    const bytes = readFileSync(fileURLToPath(url));
    return new Response(bytes, {
      status: 200,
      headers: { 'Content-Type': 'application/wasm' },
    });
  }
  return originalFetch(input, init);
}) as typeof fetch;
