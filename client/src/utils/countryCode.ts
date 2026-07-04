/**
 * countryCode.ts
 *
 * ISO 3166-1 alpha-2 lookup helpers for flag icon rendering.
 *
 * Flag emojis are composed from Unicode Regional Indicator Symbols.
 * Each letter A–Z maps to a regional indicator symbol (U+1F1E6–U+1F1FF).
 * Pairing two such symbols for a valid ISO 3166-1 alpha-2 code produces
 * the corresponding flag emoji on supporting platforms.
 */

/**
 * Converts an ISO 3166-1 alpha-2 country code to its flag emoji.
 *
 * @param code - A 2-letter ISO 3166-1 alpha-2 country code (e.g. "US", "CN")
 * @returns The flag emoji string (e.g. "🇺🇸", "🇨🇳"), or an empty string
 *          if the code is not exactly 2 ASCII letters.
 *
 * @example
 * countryCodeToFlagEmoji("US") // "🇺🇸"
 * countryCodeToFlagEmoji("GB") // "🇬🇧"
 * countryCodeToFlagEmoji("CN") // "🇨🇳"
 */
export function countryCodeToFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';

  const upper = code.toUpperCase();

  // Validate that both characters are ASCII letters A–Z
  const charA = upper.charCodeAt(0);
  const charB = upper.charCodeAt(1);
  if (
    charA < 65 || charA > 90 ||
    charB < 65 || charB > 90
  ) {
    return '';
  }

  // Regional Indicator Symbol base: U+1F1E6 corresponds to 'A' (charCode 65)
  const REGIONAL_INDICATOR_BASE = 0x1f1e6 - 65;

  return (
    String.fromCodePoint(REGIONAL_INDICATOR_BASE + charA) +
    String.fromCodePoint(REGIONAL_INDICATOR_BASE + charB)
  );
}

/**
 * Returns an accessible ARIA label for a flag icon.
 *
 * @param countryName - The human-readable country or region name
 * @returns A descriptive label string suitable for `aria-label`
 *
 * @example
 * getFlagAriaLabel("United States") // "Flag of United States"
 */
export function getFlagAriaLabel(countryName: string): string {
  return `Flag of ${countryName}`;
}
