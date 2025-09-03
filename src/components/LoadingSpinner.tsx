import useAppPlatformColors from "@/hooks/useAppPlatformColors";
import { PlatformColor, Text, View } from "react-native"

// ✅ 

// TODO: add in something fancier

const LoadingSpinner = () => {
    const { background } = useAppPlatformColors();
    return (
        <View
            className='w-full h-full justify-center items-center'
            style={{ backgroundColor: PlatformColor(background) }}
        >
            <Text style={{ color: PlatformColor('label') }}>
                Loading
            </Text>
        </View>
    )
}

export default LoadingSpinner;