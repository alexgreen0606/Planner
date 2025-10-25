import { getValidCssColor } from "@/utils/colorUtils";
import { Button, Host, Image } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { SFSymbol } from "expo-symbols";
import { PlatformColor } from "react-native";

// ✅ 

type TGlassIconButtonProps = {
    systemImage: SFSymbol;
    disabled?: boolean;
    isPrimary?: boolean;
    color?: string;
    iconPlatformColor?: string;
    onPress?: () => void;
}

const GlassIconButton = ({
    systemImage,
    disabled,
    isPrimary,
    color,
    iconPlatformColor = 'label',
    onPress
}: TGlassIconButtonProps) => (
    <Host matchContents>
        <Button
            onPress={onPress}
            color={getValidCssColor(color)}
            variant={isPrimary ? 'glassProminent' : 'glass'}
            disabled={disabled}
            modifiers={[frame({ height: 45, width: 45 })]}
        >
            <Host style={{ height: 45, width: 45 }}>
                <Image
                    systemName={systemImage}
                    color={PlatformColor(disabled ? 'tertiaryLabel' : iconPlatformColor) as unknown as string}
                />
            </Host>
        </Button>
    </Host>
);

export default GlassIconButton;