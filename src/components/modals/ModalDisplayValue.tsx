import { Host, HStack, Label, Spacer } from '@expo/ui/swift-ui';
import { SFSymbol } from 'expo-symbols';
import React from 'react';
import { PlatformColor, View } from 'react-native';

import { MODAL_INPUT_HEIGHT } from '@/lib/constants/layout';

interface IModalDisplayValueProps {
  label: string;
  value: React.ReactNode;
  disabled?: boolean;
  iconName?: SFSymbol;
}

const ModalDisplayValue = ({ label, value, disabled, iconName }: IModalDisplayValueProps) => (
  <View
    className="flex-row w-full items-center"
    style={{ minHeight: MODAL_INPUT_HEIGHT, pointerEvents: disabled ? 'none' : 'auto' }}
  >
    <Host style={{ flex: 1 }}>
      <HStack>
        <Label
          systemImage={iconName}
          color={PlatformColor('secondaryLabel') as unknown as string}
          title={label}
        />
        <Spacer />
      </HStack>
    </Host>
    {value}
  </View>
);

export default ModalDisplayValue;
