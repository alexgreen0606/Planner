import { useColorScheme } from "react-native";

// ✅ 

const useAppPlatformColors = () => {
    const colorScheme = useColorScheme();
    const isLightMode = colorScheme === 'light';
    return {
        background: isLightMode ? 'systemGray5' : 'systemBackground',
        plannersNavbar: {
            indicator: isLightMode ? 'systemGray5' : 'systemGray4'
        },
        toolbar: {
            background: isLightMode ? 'systemGray5' : 'systemGray6',
            border: isLightMode ? 'systemGray' : 'systemGray'
        },
        modal: {
            inputField: isLightMode ? 'systemBackground' : 'systemGray5'
        }
    }
}

export default useAppPlatformColors;