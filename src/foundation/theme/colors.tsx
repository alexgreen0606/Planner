export const selectableColors = [
  'systemRed',
  'systemOrange',
  'systemYellow',
  'systemGreen',
  'systemBlue',
  'systemIndigo',
  'systemPurple',
  'systemBrown',
];

export const isValidPlatformColor = (color: string) => {
  return [
    'systemTeal',
    'systemRed',
    'systemGreen',
    'systemYellow',
    'systemPurple',
    'systemOrange',
    'systemBackground',
    'systemTeal',
    'systemGray6',
    'label',
    'systemMint',
    'secondaryLabel',
    'systemBlue',
    'systemBrown',
    'systemIndigo'
  ].includes(color);
}
