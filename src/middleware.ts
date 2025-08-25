import { NextResponse, type NextRequest } from 'next/server';

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Use Buffer when available (Node.js) otherwise fall back to btoa for Edge runtime
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(array).toString('base64');
  }
  let str = '';
  for (const byte of array) {
    str += String.fromCharCode(byte);
  }
  return btoa(str);
}

const TRUSTED_SCRIPT_SOURCES = [
  "'self'",
  'https://www.googletagmanager.com',
  'https://platform.twitter.com',
  'https://s.imgur.com',
];

export function middleware(req: NextRequest) {
  const nonce = generateNonce();

  const csp = [`script-src ${[...TRUSTED_SCRIPT_SOURCES, `'nonce-${nonce}'`].join(' ')}`].join('; ');

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  res.headers.set('Content-Security-Policy', csp);

  return res;
}

export const config = {
  matcher: '/:path*',
};

