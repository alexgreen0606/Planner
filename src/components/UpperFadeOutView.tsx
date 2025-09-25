import useAppTheme from "@/hooks/useAppTheme";
import { HEADER_HEIGHT } from "@/lib/constants/miscLayout";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ 

type UpperFadeOutViewProps = {
    floatingHeaderHeight: number;
};

const ADDITIONAL_FADE_HEIGHT = 16;

const UpperFadeOutView = ({ floatingHeaderHeight }: UpperFadeOutViewProps) => {
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const { upperFadeArray } = useAppTheme();

    const gradientHeight =
        floatingHeaderHeight > 0
            ? floatingHeaderHeight + ADDITIONAL_FADE_HEIGHT
            : HEADER_HEIGHT;

    const totalHeight = TOP_SPACER + HEADER_HEIGHT + gradientHeight;
    const solidRegion = TOP_SPACER + HEADER_HEIGHT;

    const locations = [
        0,
        solidRegion / totalHeight,
        (solidRegion + gradientHeight) / totalHeight,
    ] as const;

    return (
        <LinearGradient
            colors={upperFadeArray}
            locations={locations}
            style={{
                width: "100%",
                height: totalHeight,
                // position: "absolute",
                // top: 0,
                // left: 0,
                // zIndex: 6000,
            }}
        />
    );
};

export default UpperFadeOutView;
