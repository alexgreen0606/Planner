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
    'systemIndigo'
  ].includes(color);
}
