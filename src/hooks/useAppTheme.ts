import { BlurTint } from "expo-blur";
import { PlatformColor, useColorScheme } from "react-native";

// ✅ 

const useAppTheme = () => {
    const colorScheme = useColorScheme();
    const isLightMode = colorScheme === 'light';
    return {
        background: isLightMode ? 'systemGray5' : 'systemBackground',
        plannersNavbar: {
            background: {
                color: (isLightMode ? 'systemChromeMaterial' : 'systemChromeMaterial') as BlurTint,
                intensity: isLightMode ? 60 : 100
            },
            indicator: {
                color: (isLightMode ? 'systemUltraThinMaterialDark' : "systemThinMaterialLight") as BlurTint,
                intensity: isLightMode ? 16 : 40
            }
        },
        modal: {
            inputField: isLightMode ? 'systemBackground' : 'systemGray5'
        },
        overflowActionText: isLightMode ? 'rgb(40,40,40)' : 'rgb(240,240,240)',
        weatherBackground: isLightMode ? PlatformColor('systemGray2') : undefined,
        weatherChip: {
            background: isLightMode ? 'systemGray' : 'systemBackground',
            label: isLightMode ? 'systemGray6' : 'secondaryLabel'
        }
    }
}

export default useAppTheme;