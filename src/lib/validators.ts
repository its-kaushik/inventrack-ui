import { z } from 'zod';

/** Indian phone number: exactly 10 digits. */
export const phoneSchema = z.string().regex(/^\d{10}$/, 'Phone must be 10 digits');

/** Money amount: positive number, max 2 decimal places. */
export const moneySchema = z.coerce
  .number()
  .min(0, 'Amount must be positive')
  .transform((v) => Math.round(v * 100) / 100);

/** Whole rupee amount (no decimals). */
export const wholeRupeeSchema = z.coerce
  .number()
  .int('Amount must be a whole number')
  .min(0, 'Amount must be positive');

/** UUID v4. */
export const uuidSchema = z.string().uuid('Invalid ID');

/** Percentage 0–100. */
export const percentageSchema = z.coerce
  .number()
  .min(0, 'Must be at least 0%')
  .max(100, 'Cannot exceed 100%');

/** Non-empty trimmed string. */
export const requiredString = z.string().trim().min(1, 'Required');

/** Optional email. */
export const optionalEmail = z
  .string()
  .email('Invalid email')
  .or(z.literal(''))
  .optional()
  .transform((v) => v || null);

/** GSTIN: 15-character alphanumeric (simplified validation). */
export const gstinSchema = z
  .string()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format')
  .or(z.literal(''))
  .optional()
  .transform((v) => v || null);

/** PAN: 10-character alphanumeric. */
export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN format')
  .or(z.literal(''))
  .optional()
  .transform((v) => v || null);
