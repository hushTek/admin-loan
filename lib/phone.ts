export function normalizeTzPhoneToE164(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // keep digits and leading +
  const cleaned = raw.startsWith("+")
    ? "+" + raw.slice(1).replace(/\D/g, "")
    : raw.replace(/\D/g, "");

  // Accept formats:
  // - 0XXXXXXXXX (10 digits, leading 0) -> +255XXXXXXXXX (9 digits after 0)
  // - 255XXXXXXXXX (12 digits) -> +255XXXXXXXXX
  // - +255XXXXXXXXX -> +255XXXXXXXXX
  if (cleaned.startsWith("+255")) {
    const rest = cleaned.slice(4);
    if (rest.length !== 9) return null;
    return `+255${rest}`;
  }

  if (cleaned.startsWith("255")) {
    const rest = cleaned.slice(3);
    if (rest.length !== 9) return null;
    return `+255${rest}`;
  }

  if (cleaned.startsWith("0")) {
    const rest = cleaned.slice(1);
    if (rest.length !== 9) return null;
    return `+255${rest}`;
  }

  return null;
}

