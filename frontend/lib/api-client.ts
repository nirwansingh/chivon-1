import { cookies } from 'next/headers';
import { Decimal } from 'decimal.js';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.__decimal === 'string' && Object.keys(record).length === 1) {
      return new Decimal(record.__decimal);
    }
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(record)) {
      if (key === 'passwordHash') continue;
      out[key] = revive(nested);
    }
    return out;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value;
}

export async function api<T = any>(
  path: string,
  init?: { method?: string; body?: unknown; formData?: FormData }
): Promise<T> {
  const token = (await cookies()).get('chivon_session')?.value;
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init?.formData) {
    body = init.formData;
  } else if (init?.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: init?.method || 'GET',
    headers,
    body,
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    return (await response.arrayBuffer()) as T;
  }

  const json = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, json.error || 'Request failed', json.details);
  }
  return revive(json) as T;
}
