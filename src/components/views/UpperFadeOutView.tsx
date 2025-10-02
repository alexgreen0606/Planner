import { LinearGradient } from "expo-linear-gradient";
import { ColorValue } from "react-native";

// ✅ 

type TUpperFadeOutViewProps = {
    colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
    totalHeight: number;
    solidHeight?: number;
};

const UpperFadeOutView = ({ colors, totalHeight, solidHeight = 0 }: TUpperFadeOutViewProps) => {
    return (
        <LinearGradient
            colors={colors}
            locations={[0, solidHeight / totalHeight, 1]}
            style={{
                width: "100%",
                height: totalHeight
            }}
        />
    );
};

export default UpperFadeOutView;
