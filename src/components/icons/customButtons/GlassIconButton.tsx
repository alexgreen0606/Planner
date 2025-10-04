import { Button, Host, Image, Label } from "@expo/ui/swift-ui";
import { frame, tint } from "@expo/ui/swift-ui/modifiers";
import { SFSymbol } from "expo-symbols";
import { PlatformColor } from "react-native";

// ✅ 

type TGlassIconButtonProps = {
    systemImage: SFSymbol;
    disabled?: boolean;
    label?: string;
    isPrimary?: boolean;
    width?: number;
    platformColor?: string;
    onPress?: () => void;
}

const GlassIconButton = ({
    systemImage,
    disabled,
    label,
    width = 45,
    isPrimary,
    platformColor = 'label',
    onPress
}: TGlassIconButtonProps) => {
    return (
        <Host matchContents>
            <Button disabled={disabled} modifiers={[frame({ height: 45, width })]} variant={isPrimary ? 'glassProminent' : 'glass'} onPress={onPress}>
                <Host style={{ height: 45, width }}>
                    {label ? (
                        <Label color={PlatformColor(platformColor) as unknown as string} systemImage='chevron.left' title={label} />
                    ) : (
                        <Image
                            systemName={systemImage}
                            color={PlatformColor(platformColor) as unknown as string}
                        />
                    )}
                </Host>
            </Button>
        </Host>
    )
};

export default GlassIconButton;