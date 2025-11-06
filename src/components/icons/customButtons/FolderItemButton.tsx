import { SymbolView } from 'expo-symbols';
import React from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

import useBounceTrigger from '@/hooks/useBounceTrigger';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

// ✅

type TFolderItemButtonProps = {
  item: IFolderItem;
  disabled?: boolean;
  onClick: () => void;
};

const FolderItemButton = ({ item, disabled, onClick }: TFolderItemButtonProps) => {
  const bounceTrigger = useBounceTrigger([item.type, item.platformColor, item.itemIds]);
  return (
    <TouchableOpacity disabled={disabled} onPress={onClick}>
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
