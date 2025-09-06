import { BlurTint } from "expo-blur";
import { useColorScheme } from "react-native";

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
        toolbar: {
            background: {
                color: isLightMode ? 'systemGray5' : 'systemGray6',
                intensity: isLightMode ? 60 : 60
            },
            border: isLightMode ? 'systemGray' : 'systemGray'
        },
        modal: {
            inputField: isLightMode ? 'systemBackground' : 'systemGray5'
        },
        overflowText: isLightMode ? 'rgb(20,20,20)' : 'rgb(240,240,240)'
    }
}

export default useAppTheme;