import { ColorValue, PlatformColor, useColorScheme } from "react-native";

// ✅ 

const useAppTheme = () => {
    const colorScheme = useColorScheme();
    const isLightMode = colorScheme === 'light';
    return {
        background: isLightMode ? 'systemGray5' : 'systemBackground',
        modal: {
            inputField: isLightMode ? 'systemBackground' : 'systemGray5'
        },
        overflowActionText: isLightMode ? 'rgb(40,40,40)' : 'rgb(240,240,240)',
        weatherBackground: isLightMode ? PlatformColor('systemGray2') : undefined,
        weatherChip: {
            background: isLightMode ? 'systemGray' : 'systemBackground',
            label: isLightMode ? 'systemGray6' : 'secondaryLabel'
        },
        upperFadeArray: (isLightMode ? ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.05)'] :
            ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.05)']) as readonly [ColorValue, ColorValue, ...ColorValue[]]
    }
}

export default useAppTheme;