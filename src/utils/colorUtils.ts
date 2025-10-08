// ✅ 

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
