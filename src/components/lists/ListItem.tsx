import { Host } from '@expo/ui/swift-ui';
import React, { ReactNode, useMemo } from 'react';
import { NativeSyntheticEvent, PlatformColor, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import { ListTextfield } from "sortable-list";

import { LARGE_MARGIN } from '@/lib/constants/layout';
import { EListLayout } from '@/lib/enums/EListLayout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { getValidCssColor } from '@/utils/colorUtils';

// TODO: add debounced save handler to this file

interface IListItemProps<T extends TListItem> {
  listId: string;
  itemId: string;
  itemIndex: number;
  storage: MMKV;
  onCreateItem: (index: number) => void;
  onDeleteItem: (item: T) => void;
  onValueChange?: (newValue: string) => void;
  onSaveToExternalStorage?: (item: T) => void;
  onContentClick?: (item: T) => void;
  onGetRowTextPlatformColor?: (item: T) => string;
  onGetLeftIcon?: (item: T) => ReactNode;
  onGetRightIcon?: (item: T) => ReactNode;
  onGetIsItemDeletingCustom?: (item: T) => boolean;
  onGetIsEditable?: (item: T) => boolean;
};

const ListItem = <T extends TListItem>({
  listId,
  itemId,
  storage,
  itemIndex,
  onValueChange,
  onCreateItem,
  onDeleteItem,
  onContentClick,
  onSaveToExternalStorage,
  onGetRightIcon,
  onGetRowTextPlatformColor,
  onGetLeftIcon,
  onGetIsEditable,
  onGetIsItemDeletingCustom
}: IListItemProps<T>) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [item, setItem] = useMMKVObject<T>(itemId, storage);

  const isEditable = useMemo(() => (item ? (onGetIsEditable?.(item) ?? true) : true), [item]);

  // Track deletion status of the item.
  const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();
  const isPendingDelete = item
    ? (onGetIsItemDeletingCustom?.(item) ?? onGetIsItemDeletingCallback(item))
    : false;

  const textPlatformColor = useMemo(
    () => {
      if (onGetRowTextPlatformColor && item) {
        return onGetRowTextPlatformColor(item);
      }
      return isPendingDelete ? 'tertiaryLabel' : 'label';
    },
    [item, isPendingDelete, onGetRowTextPlatformColor]
  );

  function handleCreateUpperItem() {
    onCreateItem(itemIndex);
  }

  function handleCreateLowerItem() {
    onCreateItem(itemIndex + 1);
  }

  function handleValueChange({ nativeEvent: { value } }: NativeSyntheticEvent<{ value: string }>) {
    setItem((prev) => {
      if (!prev) return prev;
      return { ...prev, value };
    });
  }

  if (!item) return null;

  return (
    <View className='w-full justify-between' style={{
      height: EListLayout.ITEM_HEIGHT,
      borderTopColor: itemIndex === 0 ? PlatformColor('systemGray') : undefined,
      borderBottomColor: PlatformColor('systemGray'),
      borderWidth: StyleSheet.hairlineWidth,
      borderStyle: 'solid'
    }}>
      {/* Separator Line */}
      <Pressable onPress={handleCreateUpperItem} className='w-full' style={{ height: EListLayout.NEW_ITEM_TRIGGER_HEIGHT }} />

      {/* Content */}
      <View className="flex-row w-full items-center gap-4" style={{ width: SCREEN_WIDTH - LARGE_MARGIN - 22, height: EListLayout.CONTENT_HEIGHT }}>
        {onGetLeftIcon?.(item)}
        <Host style={{ flex: 1, height: EListLayout.ITEM_HEIGHT }}>
          <ListTextfield
            id={itemId}
            value={item.value}
            onValueChange={handleValueChange}
            textColor={getValidCssColor(textPlatformColor)}
          // TODO: isEditable : false when is deleting
          />
        </Host>
        {onGetRightIcon?.(item)}
      </View>

      {/* Separator Line */}
      <Pressable onPress={handleCreateLowerItem} className='w-full' style={{ height: EListLayout.NEW_ITEM_TRIGGER_HEIGHT }} />
    </View>
  );
};

export default ListItem;
