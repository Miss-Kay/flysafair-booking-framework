/** Typed test data — single source of truth, easy to extend to data-driven runs. */

export interface SearchCriteria {
  from: string;
  to: string;
  departDate: string; // ISO yyyy-mm-dd
  returnDate?: string; // ISO yyyy-mm-dd — required when tripType is 'return'
  tripType: 'oneway' | 'return';
}

/** Date N days from now, in ISO format — keeps tests evergreen. */
export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const defaultSearch: SearchCriteria = {
  from: 'Johannesburg',
  to: 'Dubai',
  departDate: daysFromNow(30),
  returnDate: daysFromNow(37),
  tripType: 'return',
};
