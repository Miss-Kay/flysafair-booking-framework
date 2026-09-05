/** Typed test data — single source of truth, easy to extend to data-driven runs. */

export interface SearchCriteria {
  from: string;      // city typed into the origin autocomplete
  fromCode: string;  // IATA code used to disambiguate the suggestion
  to: string;
  toCode: string;
  departDate: string; // ISO yyyy-mm-dd
  returnDate?: string; // ISO yyyy-mm-dd — required when tripType is 'return'
  tripType: 'oneway' | 'return';
  adults: number;
}

/** Date N days from now, in ISO format — keeps tests evergreen. */
export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const defaultSearch: SearchCriteria = {
  from: 'Johannesburg',
  fromCode: 'JNB',
  to: 'Cape Town',
  toCode: 'CPT',
  departDate: daysFromNow(30),
  tripType: 'oneway',
  adults: 1,
};

/** Data-driven matrix — the spec generates one test per entry. */
export const searchMatrix: SearchCriteria[] = [defaultSearch];
