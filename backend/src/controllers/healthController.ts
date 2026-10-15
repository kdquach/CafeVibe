import type { RequestHandler } from 'express';
import type { ApiSuccess } from '../types/api.js';

export interface HealthData {
  status: 'ok';
  timestamp: string;
}

export const getHealth: RequestHandler = (_req, res) => {
  const body: ApiSuccess<HealthData> = {
    data: { status: 'ok', timestamp: new Date().toISOString() },
  };
  res.status(200).json(body);
};
