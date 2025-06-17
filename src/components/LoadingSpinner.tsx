import { PlatformColor, Text, View } from "react-native"

const LoadingSpinner = () => {
    return (
        <View 
        className='w-full h-full justify-center items-center'
        style={{backgroundColor: PlatformColor('systemBackground')}}
        >
            <Text style={{color: PlatformColor('label')}}>
                Loading
            </Text>
        </View>
    )
}

export default LoadingSpinner;