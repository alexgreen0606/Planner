import useAppTheme from "@/hooks/useAppTheme";
import { HEADER_HEIGHT } from "@/lib/constants/miscLayout";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ 

type UpperFadeOutViewProps = {
    floatingBannerHeight: number;
};

const UpperFadeOutView = ({ floatingBannerHeight }: UpperFadeOutViewProps) => {
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const { upperFadeArray } = useAppTheme();

    const gradientHeight = floatingBannerHeight > 0 ? floatingBannerHeight + 16 : HEADER_HEIGHT;
    const totalHeight = gradientHeight + TOP_SPACER;

    // Top spacer remains consistent height so Status Bar is readable.
    const locations = [
        0,
        TOP_SPACER / totalHeight,
        (TOP_SPACER + gradientHeight) / totalHeight
    ] as readonly [number, number, ...number[]];

    return (
        <LinearGradient
            colors={upperFadeArray}
            locations={locations}
            style={{
                width: "100%",
                height: totalHeight,
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 6000,
            }}
        />
    );
};

export default UpperFadeOutView;
