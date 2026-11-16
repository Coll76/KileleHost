export type CardBrand = 'Visa' | 'Mastercard' | 'Verve' | 'Amex' | 'Card';

export function stripNonDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function detectCardBrand(digitsOnly: string): CardBrand {
  if (/^4/.test(digitsOnly)) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digitsOnly)) {
    return 'Mastercard';
  }
  if (/^(506|650)/.test(digitsOnly)) return 'Verve';
  if (/^3[47]/.test(digitsOnly)) return 'Amex';
  return 'Card';
}

export function formatCardNumber(raw: string): string {
  const digits = stripNonDigits(raw).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatCardExpiry(raw: string): string {
  const digits = stripNonDigits(raw).slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function passesLuhnCheck(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function validateCardNumberInput(raw: string): string | null {
  const digits = stripNonDigits(raw);
  if (!digits) {
    return 'Enter your card number';
  }
  if (digits.length < 13) {
    return 'Enter the full 16-digit card number';
  }
  // Allow mocked decline test card 4000 0000 0000 0002 to reach server simulation
  if (digits === '4000000000000002') {
    return null;
  }
  if (!passesLuhnCheck(digits)) {
    return 'That card number looks invalid — double-check the digits';
  }
  return null;
}

export function validateCardExpiryInput(raw: string): string | null {
  const digits = stripNonDigits(raw);
  if (digits.length < 4) {
    return 'Enter expiry as MM/YY';
  }
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2, 4));
  if (month < 1 || month > 12) {
    return 'Enter a valid month (01–12)';
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'This card is expired — use an active card';
  }
  return null;
}

export function validateCardCvcInput(raw: string, brand: CardBrand): string | null {
  const digits = stripNonDigits(raw);
  const minLen = brand === 'Amex' ? 4 : 3;
  if (digits.length < minLen || digits.length > 4) {
    return brand === 'Amex'
      ? 'Enter the 4-digit security code'
      : 'Enter the 3-digit CVC on the back of your card';
  }
  return null;
}
