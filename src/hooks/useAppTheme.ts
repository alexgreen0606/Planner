import { ColorValue, PlatformColor, useColorScheme } from 'react-native'

// ✅

const useAppTheme = () => {
  const colorScheme = useColorScheme()
  const isLightMode = colorScheme === 'light'
  return {
    // separate into: PlatformColor, ColorArray, and CssColor

    modal: {
      inputField: isLightMode ? 'systemBackground' : 'systemGray5',
    },
    shadowColor: isLightMode ? 'rgb(229,229,234)' : 'black',

    isLightMode,
    PlatformColor: {
      background: isLightMode ? 'systemGray5' : 'systemBackground',
    },
    CssColor: {
      background: PlatformColor(isLightMode ? 'systemGray5' : 'systemBackground'),
    },
    ColorArray: {
      TransparentModal: {
        upper: (isLightMode
          ? ['rgba(229,229,234,0.7)', 'rgba(229,229,234,0.7)', 'rgba(229,229,234,0)']
          : ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[],
        ],

        lower: (isLightMode
          ? ['rgba(229,229,234,0)', 'rgba(229,229,234,0.7)']
          : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[],
        ],
      },
      Modal: {
        upper: (isLightMode
          ? ['rgba(229,229,234,0.85)', 'rgba(229,229,234,0.85)', 'rgba(229,229,234,0)']
          : ['rgba(28,28,30,0.85)', 'rgba(28,28,30,.85)', 'rgba(28,28,30,0)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[],
        ],
      },
      Screen: {
        upper: (isLightMode
          ? ['rgba(229,229,234,0.85)', 'rgba(229,229,234,0.85)', 'rgba(229,229,234,0)']
          : ['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.78)', 'rgba(0,0,0,0)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[],
        ],
        upperDark: (isLightMode
          ? ['rgba(229,229,234,0.95)', 'rgba(229,229,234,0.95)', 'rgba(229,229,234,0)']
          : ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.95)', 'rgba(0,0,0,0)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[],
        ],
      },
    },
  }
}

export default useAppTheme
