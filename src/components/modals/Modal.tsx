import { GlassEffectContainer, Host, VStack } from '@expo/ui/swift-ui';
import React, { ReactNode } from 'react';
import { View } from 'react-native';

import GlassIconButton from '../buttons/GlassIconButton';
import PopupList, { IPopupListProps } from '../PopupList';

interface IModalProps {
  primaryButtonConfig: {
    color?: string;
    disabled?: boolean;
    onClick: () => void;
  };
  deleteButtonConfig?: IPopupListProps;
  isStaticMode?: boolean;
  children: ReactNode;
  onClose: () => void;
};

const Modal = ({
  primaryButtonConfig,
  deleteButtonConfig,
  isStaticMode,
  children,
  onClose
}: IModalProps) => (
  <Host style={{ flex: 1 }}>
    <GlassEffectContainer>
      <VStack>
        <View className="p-4">
          {/* Close and Submit Buttons */}
          {!isStaticMode && (
            <View className="flex-row justify-between">
              <GlassIconButton systemImage="xmark" onPress={onClose} />
              <GlassIconButton
                systemImage="checkmark"
                isPrimary={!!primaryButtonConfig.color}
                color={primaryButtonConfig.color}
                disabled={primaryButtonConfig.disabled}
                onPress={primaryButtonConfig.onClick}
              />
            </View>
          )}

          {/* Contents */}
          <View className="px-4 pt-4">{children}</View>

          {/* Delete Button */}
          {!isStaticMode && deleteButtonConfig && (
            <View className="w-full items-start pt-4">
              <PopupList
                {...deleteButtonConfig}
                systemImage="trash"
                iconPlatformColor="systemRed"
                wrapButton
              />
            </View>
          )}
        </View>
      </VStack>
    </GlassEffectContainer>
  </Host>
);

export default Modal;
