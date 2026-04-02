import { NextRequest, NextResponse } from 'next/server';

const INTEL_URL = process.env.NEXT_PUBLIC_INTEL_URL || 'http://localhost:8001';
const PROXY_TIMEOUT = 300000; // 300 seconds (5 min) for LLM + OCR responses

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${INTEL_URL}/${path.join('/')}${req.nextUrl.search}`;

  try {
    const res = await fetch(target, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(PROXY_TIMEOUT),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Intelligence API not available', predictions: [] },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${INTEL_URL}/${path.join('/')}${req.nextUrl.search}`;
  const contentType = req.headers.get('content-type') || '';

  try {
    let fetchOpts: RequestInit;

    if (contentType.includes('multipart/form-data')) {
      // File upload — forward the raw body with original content-type
      const body = await req.arrayBuffer();
      fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: body,
        signal: AbortSignal.timeout(PROXY_TIMEOUT),
      };
    } else {
      // JSON request
      const body = await req.text();
      fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(PROXY_TIMEOUT),
      };
    }

    const res = await fetch(target, fetchOpts);
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Intelligence API not available' },
      { status: 503 }
    );
  }
}
