import { Button, Host, VStack } from "@expo/ui/swift-ui";
import { frame, glassEffect } from "@expo/ui/swift-ui/modifiers";
import { PlatformColor } from "react-native";

type TGlassIconButtonProps = {
    systemImage: string;
    disabled?: boolean;
    onPress?: () => void;
}

const GlassIconButton = ({ systemImage, disabled, onPress }: TGlassIconButtonProps) => {
    return (
        <Host matchContents>
            <Button onPress={onPress} variant="glass" modifiers={[glassEffect({ glass: { variant: 'clear' } })]}>
                <VStack modifiers={[frame({ width: 20, height: 28, alignment: 'center' })]}>
                    <Button onPress={onPress} systemImage={systemImage} color={PlatformColor(disabled ? 'tertiaryLabel' : 'label') as unknown as string} />
                </VStack>
            </Button>
        </Host>
    )
};

export default GlassIconButton;