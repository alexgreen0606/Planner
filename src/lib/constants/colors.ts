// ✅ 

export const selectableColors = [
  'systemRed',
  'systemOrange',
  'systemYellow',
  'systemGreen',
  'systemCyan',
  'systemIndigo',
  'systemPurple',
  'systemBrown',
  'label',
];

export const platformToRgbMap: Record<string, string> = {
  'systemRed': 'rgb(255,66,69)',
  'systemOrange': 'rgb(255, 146, 48)',
  'systemYellow': 'rgb(255,214,0)',
  'systemGreen': 'rgb(48,209,88)',
  'systemCyan': 'rgb(60, 211, 254)',
  'systemIndigo': 'rgb(107,93,255)',
  'systemPurple': 'rgb(219,52,242)',
  'systemBrown': 'rgb(183,138,102)',
}

export type TSelectableColor = (typeof selectableColors)[number];
