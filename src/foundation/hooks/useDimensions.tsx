import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BANNER_HEIGHT } from "../components/constants";

const useDimensions = () => {
    const {top, bottom} = useSafeAreaInsets();
    const {width, height} = useWindowDimensions();
    const bannerHeight = BANNER_HEIGHT + top;

    return {
        screenWidth: width,
        screenHeight: height,
        topSpacer: top,
        bottomSpacer: bottom,
        bannerHeight
    }
}

export default useDimensions;