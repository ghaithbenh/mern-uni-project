import { AppError } from '../errors/app-error.js';

export const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

export const requiredString = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, message);
  }
  return value;
};

export const requiredNumber = (value: unknown, message: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new AppError(400, message);
  }
  return value;
};
