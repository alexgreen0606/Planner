import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

import useBounceTrigger from '@/hooks/useBounceTrigger';
import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

interface IFolderItemButtonProps {
  item: IFolderItem;
  disabled?: boolean;
  onClick: () => void;
}

const FolderItemButton = ({ item, disabled, onClick }: IFolderItemButtonProps) => {
  const bounceTrigger = useBounceTrigger([item.type, item.platformColor, item.itemIds]);
  return (
    <TouchableOpacity activeOpacity={PRESSABLE_OPACITY} disabled={disabled} onPress={onClick}>
      <SymbolView
        name={item.type === EFolderItemType.FOLDER ? 'folder.fill' : 'list.bullet'}
        type="monochrome"
        animationSpec={
          bounceTrigger
            ? {
              effect: { type: 'bounce' },
              repeating: false
            }
            : undefined
        }
        size={24}
        tintColor={PlatformColor(disabled ? 'tertiaryLabel' : item.platformColor)}
      />
    </TouchableOpacity>
  );
};

export default FolderItemButton;
