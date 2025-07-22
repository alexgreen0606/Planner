import { PlatformColor, Text, View } from "react-native"

// ✅ 

// TODO: add in something fancier

const LoadingSpinner = () =>
    <View
        className='w-full h-full justify-center items-center'
        style={{ backgroundColor: PlatformColor('systemBackground') }}
    >
        <Text style={{ color: PlatformColor('label') }}>
            Loading
        </Text>
    </View>;

export default LoadingSpinner;