import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import { searchIntentSchema, type SearchIntent } from '@/features/intent/schemas';
import { searchResponseSchema, type SearchResponse } from './schemas';

const intentResponseSchema = z.object({ data: searchIntentSchema });
const searchApiResponseSchema = z.object({ data: searchResponseSchema });
const errorEnvelopeSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function errorMessage(parsed: unknown, fallback: string): string {
  const envelope = errorEnvelopeSchema.safeParse(parsed);
  if (envelope.success) return envelope.data.error.message;
  return fallback;
}

async function postJson(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Network request failed');
  }
  const json = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(errorMessage(json, `API responded with status ${response.status}`));
  }
  return json;
}

/** POST /api/v1/search/intent, validate response bằng Zod. */
export async function fetchIntent(query: string, signal?: AbortSignal): Promise<SearchIntent> {
  const json = await postJson('/api/v1/search/intent', { query }, signal);
  const parsed = intentResponseSchema.safeParse(json);
  if (!parsed.success) throw new ApiError('API returned an unexpected response shape');
  return parsed.data.data;
}

/** POST /api/v1/search với intent đã xác nhận, validate response bằng Zod. */
export async function fetchSearch(intent: SearchIntent, signal?: AbortSignal): Promise<SearchResponse> {
  const json = await postJson('/api/v1/search', { intent }, signal);
  const parsed = searchApiResponseSchema.safeParse(json);
  if (!parsed.success) throw new ApiError('API returned an unexpected response shape');
  return parsed.data.data;
}
