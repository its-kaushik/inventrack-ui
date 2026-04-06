import { useMemo } from 'react';
import {
  getCurrentFY,
  getFYShortCode,
  getFYStartDate,
  getFYEndDate,
} from '@/lib/financial-year';

/** Returns current FY information, memoized. */
export function useFinancialYear() {
  return useMemo(() => {
    const now = new Date();
    return {
      label: getCurrentFY(now),
      shortCode: getFYShortCode(now),
      startDate: getFYStartDate(now),
      endDate: getFYEndDate(now),
    };
  }, []);
}
