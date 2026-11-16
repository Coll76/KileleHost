export interface PhoneCountryCodeOption {
  code: string;
  label: string;
  flag: string;
  country: string;
}

export const PHONE_COUNTRY_CODES: PhoneCountryCodeOption[] = [
  { code: '+254', label: '+254 (KE)', flag: '🇰🇪', country: 'Kenya' },
  { code: '+255', label: '+255 (TZ)', flag: '🇹🇿', country: 'Tanzania' },
  { code: '+256', label: '+256 (UG)', flag: '🇺🇬', country: 'Uganda' },
  { code: '+250', label: '+250 (RW)', flag: '🇷🇼', country: 'Rwanda' },
  { code: '+234', label: '+234 (NG)', flag: '🇳🇬', country: 'Nigeria' },
  { code: '+27', label: '+27 (ZA)', flag: '🇿🇦', country: 'South Africa' },
  { code: '+44', label: '+44 (GB)', flag: '🇬🇧', country: 'United Kingdom' },
  { code: '+49', label: '+49 (DE)', flag: '🇩🇪', country: 'Germany' },
  { code: '+1', label: '+1 (US)', flag: '🇺🇸', country: 'United States' },
];

export interface AddressSuggestion {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

const MOCK_ADDRESS_DIRECTORY: AddressSuggestion[] = [
  {
    id: 'ke-kilimani',
    street: 'Argwings Kodhek Road, Kilimani',
    city: 'Nairobi',
    postalCode: '00100',
    country: 'Kenya',
  },
  {
    id: 'ke-westlands',
    street: 'Waiyaki Way, Westlands Commercial Centre',
    city: 'Nairobi',
    postalCode: '00800',
    country: 'Kenya',
  },
  {
    id: 'ke-karen',
    street: 'Ngong Road, Karen Plains',
    city: 'Nairobi',
    postalCode: '00502',
    country: 'Kenya',
  },
  {
    id: 'ke-nyali',
    street: 'Links Road, Nyali Bridge Avenue',
    city: 'Mombasa',
    postalCode: '80118',
    country: 'Kenya',
  },
  {
    id: 'ke-kisumu',
    street: 'Oginga Odinga Street, Milimani',
    city: 'Kisumu',
    postalCode: '40100',
    country: 'Kenya',
  },
  {
    id: 'ng-vi',
    street: 'Adeola Odeku Street, Victoria Island',
    city: 'Lagos',
    postalCode: '101241',
    country: 'Nigeria',
  },
  {
    id: 'za-sandton',
    street: 'Rivonia Road, Sandton Central',
    city: 'Johannesburg',
    postalCode: '2196',
    country: 'South Africa',
  },
  {
    id: 'gb-shoreditch',
    street: '45 Old Street, Shoreditch',
    city: 'London',
    postalCode: 'EC1V 9HX',
    country: 'United Kingdom',
  },
  {
    id: 'de-mitte',
    street: 'Friedrichstrasse 112, Mitte',
    city: 'Berlin',
    postalCode: '10117',
    country: 'Germany',
  },
  {
    id: 'us-nyc',
    street: '350 5th Avenue, Midtown',
    city: 'New York',
    postalCode: '10118',
    country: 'United States',
  },
];

export function searchMockAddresses(
  query: string,
  country: string
): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) {
    return [];
  }

  const matched = MOCK_ADDRESS_DIRECTORY.filter(
    (entry) =>
      entry.street.toLowerCase().includes(q) ||
      entry.city.toLowerCase().includes(q) ||
      entry.postalCode.toLowerCase().includes(q)
  );

  if (matched.length > 0) {
    return matched.slice(0, 5);
  }

  // Fallback realistic suggestions tailored to the user's typed street and selected country
  const cleanTitle = query
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const countryDefaults: Record<
    string,
    { city: string; postal: string; suffix: string }
  > = {
    Kenya: { city: 'Nairobi', postal: '00100', suffix: 'Westlands' },
    Nigeria: { city: 'Lagos', postal: '101241', suffix: 'Ikeja' },
    'South Africa': { city: 'Johannesburg', postal: '2196', suffix: 'Sandton' },
    'United Kingdom': { city: 'London', postal: 'EC2A 4NE', suffix: 'Central' },
    Germany: { city: 'Berlin', postal: '10117', suffix: 'Mitte' },
    'United States': { city: 'New York', postal: '10001', suffix: 'Suite 400' },
  };
  const def = countryDefaults[country] ?? countryDefaults.Kenya;

  return [
    {
      id: 'dyn-1',
      street: `${cleanTitle}, ${def.suffix}`,
      city: def.city,
      postalCode: def.postal,
      country,
    },
    {
      id: 'dyn-2',
      street: `${cleanTitle} Plaza, Floor 3`,
      city: def.city,
      postalCode: def.postal,
      country,
    },
  ];
}

export interface PasswordStrengthReport {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  checks: {
    minLength: boolean;
    upperAndLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
  allPassed: boolean;
}

export function evaluatePasswordStrength(
  password: string
): PasswordStrengthReport {
  const minLength = password.length >= 8;
  const upperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const count =
    (minLength ? 1 : 0) +
    (upperAndLower ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSymbol ? 1 : 0);

  const score = count as 0 | 1 | 2 | 3 | 4;
  const label: PasswordStrengthReport['label'] =
    score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  return {
    score,
    label,
    checks: {
      minLength,
      upperAndLower,
      hasNumber,
      hasSymbol,
    },
    allPassed: count === 4,
  };
}

export function validateEmailValue(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Enter an email like name@example.com';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter an email like name@example.com';
  }
  return null;
}

export function validatePhoneValue(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 14) {
    return 'Enter a valid phone number (7 to 14 digits)';
  }
  return null;
}
