import { PlatformColor } from 'react-native';

/**
 * Validates if the given color is an ios platform color.
 *
 * @param color - The color string to analyze.
 * @returns True if the color is a valid platform color, otherwise false.
 */
export function isValidPlatformColor(color: string) {
  return [
    'systemBlue',
    'systemRed',
    'systemGreen',
    'systemYellow',
    'systemPurple',
    'systemOrange',
    'systemBackground',
    'systemBlue',
    'systemGray6',
    'label',
    'systemMint',
    'secondaryLabel',
    'systemBlue',
    'systemBrown',
    'systemBlue',
    'systemCyan',
    'systemIndigo',
    'tertiaryLabel'
  ].includes(color);
}

/**
 * Gets a valid CSS value representing the given color.
 *
 * @param color - The color string to analyze.
 * @returns A platform, HEX, or rgb value to use in CSS styles.
 */
export function getValidCssColor(color?: string): string | undefined {
  return color
    ? isValidPlatformColor(color)
      ? (PlatformColor(color) as unknown as string)
      : color
    : undefined;
}

/**
 * Converts a hex string into an rgb string with opacity.
 *
 * @param hex - The hex string to convert.
 * @param opacity - The opacity for the new color value.
 * @returns An rgba string matching the hex value.
 */
export function getRgbFromHex(hex: string, opacity = 0.4): string {
  let normalized = hex.trim().replace('#', '');

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (!/^([0-9A-F]{6})$/i.test(normalized)) {
    console.warn(`Invalid hex color: ${hex}`);
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
