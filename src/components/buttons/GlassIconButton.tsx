import { Button, Host, Image } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { SFSymbol } from 'expo-symbols';
import { PlatformColor } from 'react-native';

import { GLASS_BUTTON_SIZE } from '@/lib/constants/layout';
import { getValidCssColor } from '@/utils/colorUtils';

interface IGlassIconButtonProps {
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
}: IGlassIconButtonProps) => (
  <Host matchContents>
    <Button
      onPress={onPress}
      color={getValidCssColor(color)}
      variant={isPrimary && color !== 'label' ? 'glassProminent' : 'glass'}
      disabled={disabled}
      modifiers={[frame({ height: GLASS_BUTTON_SIZE, width: GLASS_BUTTON_SIZE })]}
    >
      <Host style={{ height: GLASS_BUTTON_SIZE, width: GLASS_BUTTON_SIZE }}>
        <Image
          systemName={systemImage}
          color={PlatformColor(disabled ? 'tertiaryLabel' : iconPlatformColor) as unknown as string}
        />
      </Host>
    </Button>
  </Host>
);

export default GlassIconButton;
