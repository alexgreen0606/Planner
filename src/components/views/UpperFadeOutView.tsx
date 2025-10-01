import useAppTheme from "@/hooks/useAppTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ 

type TUpperFadeOutViewProps = {
    totalHeight: number;
    solidHeight?: number;
};

const UpperFadeOutView = ({ totalHeight, solidHeight = 0 }: TUpperFadeOutViewProps) => {
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const { upperFadeArray } = useAppTheme();
    return (
        <LinearGradient
            colors={upperFadeArray}
            locations={[0, (TOP_SPACER + solidHeight) / (TOP_SPACER + totalHeight), 1]}
            style={{
                width: "100%",
                height: TOP_SPACER + totalHeight
            }}
        />
    );
};

export default UpperFadeOutView;
