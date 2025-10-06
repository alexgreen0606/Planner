import { ColorValue, PlatformColor, useColorScheme } from "react-native";

// ✅ 

const useAppTheme = () => {
    const colorScheme = useColorScheme();
    const isLightMode = colorScheme === 'light';
    return {

        // separate into: PlatformColor, ColorArray, and CssColor

        background: isLightMode ? 'systemGray5' : 'systemBackground',
        modal: {
            inputField: isLightMode ? 'systemBackground' : 'systemGray5'
        },
        weatherBackground: isLightMode ? PlatformColor('systemGray2') : undefined,
        weatherChip: {
            background: isLightMode ? 'systemGray' : 'systemBackground',
            label: isLightMode ? 'systemGray6' : 'secondaryLabel'
        },
        shadowColor: isLightMode ? 'rgb(229,229,234)' : 'black',

        ColorArray: {
            TransparentModal: {
                upper: (isLightMode ? ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"] :
                    ['rgba(0,0,0,0.7)', 'rgba(0,0,0,.7)', 'rgba(0,0,0,0)']) as readonly [ColorValue, ColorValue, ...ColorValue[]],

                lower: (isLightMode ? ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"] :
                    ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']) as readonly [ColorValue, ColorValue, ...ColorValue[]]
            },
            Modal: {
                upper: (isLightMode ? ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"] :
                    ['rgba(28,28,30,0.85)', 'rgba(28,28,30,.85)', 'rgba(28,28,30,0)']) as readonly [ColorValue, ColorValue, ...ColorValue[]]
            },
            Screen: {
                upper: (isLightMode ? ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"] :
                    ['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']) as readonly [ColorValue, ColorValue, ...ColorValue[]]
            }
        }
    }
}

export default useAppTheme;