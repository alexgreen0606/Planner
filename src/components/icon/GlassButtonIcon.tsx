import { Button, Host, Image, Label } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { SFSymbol } from "expo-symbols";
import { PlatformColor } from "react-native";

// ✅ 

type TGlassIconButtonProps = {
    systemImage: SFSymbol;
    disabled?: boolean;
    label?: string;
    onPress?: () => void;
    width?: number;
}

const GlassIconButton = ({
    systemImage,
    disabled,
    label,
    width = 45,
    onPress
}: TGlassIconButtonProps) => {
    return (
        <Host matchContents>
            <Button modifiers={[frame({ height: 45, width })]} variant='glass' onPress={onPress}>
                <Host style={{ height: 45, width }}>
                    {label ? (
                        <Label systemImage='chevron.left' title={label} />
                    ) : (
                        <Image
                            systemName={systemImage}
                            color={(disabled ? PlatformColor('tertiaryLabel') : PlatformColor('label')) as unknown as string}
                        />
                    )}
                </Host>
            </Button>
        </Host>
    )
};

export default GlassIconButton;