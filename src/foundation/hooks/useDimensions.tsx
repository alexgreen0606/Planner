import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"

const useDimensions = () => {
    const {top, bottom} = useSafeAreaInsets();
    const {width, height} = useWindowDimensions();

    return {
        screenWidth: width,
        screenHeight: height,
        topSpacer: top,
        bottomSpacer: bottom,
    }
}

export default useDimensions;