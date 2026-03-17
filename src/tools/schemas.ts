import { z } from 'zod';
import { networks } from '../config.js';

// Shared Zod schema for networkName — used across all tools
export const networkNameSchema = z
  .string()
  .refine(val => Object.keys(networks).includes(val), { message: 'Must be a valid network name' })
  .describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet.");

// Shared error formatter
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
