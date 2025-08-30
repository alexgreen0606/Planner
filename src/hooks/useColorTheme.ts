import { useColorScheme } from "react-native";

const useAppPlatformColors = () => {
    const colorScheme = useColorScheme();
    const isLightMode = colorScheme === 'light';
    return {
        background: isLightMode ? 'systemGray5' : 'systemBackground'
    }
}

export default useAppPlatformColors;