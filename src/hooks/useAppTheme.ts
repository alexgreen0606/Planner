import { ColorValue, PlatformColor, useColorScheme } from 'react-native';

const useAppTheme = () => {
  const colorScheme = useColorScheme();
  const isLightMode = colorScheme === 'light';
  return {
    isLightMode,
    CssColor: {
      background: PlatformColor(isLightMode ? 'systemGray5' : 'systemBackground'),

      modalInputField: PlatformColor(isLightMode ? 'systemBackground' : 'systemGray5'),

      shadowColor: isLightMode ? 'rgb(229,229,234)' : 'black',
    },
    ColorArray: {
      upperFade: (isLightMode
        ? ['rgba(229,229,234,0.85)', 'rgba(229,229,234,0.85)', 'rgba(229,229,234,0)']
        : ['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.78)', 'rgba(0,0,0,0)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[]
        ],
      upperFadeDark: (isLightMode
        ? ['rgba(229,229,234,0.95)', 'rgba(229,229,234,0.95)', 'rgba(229,229,234,0)']
        : ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.95)', 'rgba(0,0,0,0)']) as readonly [
          ColorValue,
          ColorValue,
          ...ColorValue[]
        ]
    }
  };
};

export default useAppTheme;
