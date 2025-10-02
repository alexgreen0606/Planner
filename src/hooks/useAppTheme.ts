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
        weatherBackground: isLightMode ? PlatformColor('systemGray2') : undefined,
        weatherChip: {
            background: isLightMode ? 'systemGray' : 'systemBackground',
            label: isLightMode ? 'systemGray6' : 'secondaryLabel'
        },
        modalUpperFadeArray: (isLightMode ? ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"] :
            ['rgba(28,28,30,0.85)', 'rgba(28,28,30,.85)', 'rgba(28,28,30,0)']) as readonly [ColorValue, ColorValue, ...ColorValue[]],
        upperFadeArray: (isLightMode ? ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"] :
            ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']) as readonly [ColorValue, ColorValue, ...ColorValue[]],
        shadowColor: isLightMode ? 'rgb(229,229,234)' : 'black'
    }
}

export default useAppTheme;