import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"

const useDimensions = () => {
    const {top, bottom} = useSafeAreaInsets();
    const {width, height} = useWindowDimensions();

    return {
        SCREEN_WIDTH: width,
        SCREEN_HEIGHT: height,
        TOP_SPACER: top,
        BOTTOM_SPACER: bottom,
    }
}

export default useDimensions;