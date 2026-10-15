import { z } from 'zod';
import { API_BASE_URL } from './config';

const healthResponseSchema = z.object({
  data: z.object({
    status: z.literal('ok'),
    timestamp: z.string(),
  }),
});

export type Health = z.infer<typeof healthResponseSchema>['data'];

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Calls GET /api/v1/health and validates the response shape with Zod. */
export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/health`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Network request failed');
  }

  if (!response.ok) {
    throw new ApiError(`API responded with status ${response.status}`);
  }

  const parsed = healthResponseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError('API returned an unexpected response shape');
  }
  return parsed.data.data;
}
