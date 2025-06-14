import { PlatformColor, Text, View } from "react-native"

const LoadingSpinner = () => {
    return (
        <View 
        className='w-full h-full justify-center items-center'
        style={{backgroundColor: PlatformColor('systemBackground')}}
        >
            <Text>
                Loading
            </Text>
        </View>
    )
}

export default LoadingSpinner;