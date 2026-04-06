import { describe, it, expect } from 'vitest';
import { CONSTANTS } from '@/config/constants';
import { env } from '@/config/env';

describe('F1 Foundation Smoke Tests', () => {
  it('path alias @/ resolves correctly', () => {
    expect(CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBe(50);
  });

  it('env config has correct defaults', () => {
    expect(env.APP_NAME).toBe('InvenTrack');
    expect(env.API_BASE_URL).toBe('/api/v1');
  });

  it('constants have correct values', () => {
    expect(CONSTANTS.DEBOUNCE.SEARCH_MS).toBe(300);
    expect(CONSTANTS.DISCOUNT.GREEN_MAX).toBe(20);
    expect(CONSTANTS.DISCOUNT.AMBER_MAX).toBe(30);
    expect(CONSTANTS.POS.BARCODE_RAPID_KEYSTROKE_MS).toBe(50);
    expect(CONSTANTS.TOAST_DURATION_MS).toBe(3000);
  });
});
