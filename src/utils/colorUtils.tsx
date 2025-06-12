const validPlatformColors = [
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
  'systemIndigo',
  'tertiaryLabel'
];

export const isValidPlatformColor = (color: string) => validPlatformColors.includes(color);
