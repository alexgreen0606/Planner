import { useAtom } from 'jotai';
import React, { ReactNode, useMemo } from 'react';
import { PlatformColor, Pressable, StyleSheet, TextStyle, useWindowDimensions, View } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

import { textfieldIdAtom } from '@/atoms/textfieldId';
import CustomText from '@/components/text/CustomText';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

import { LARGE_MARGIN } from '@/lib/constants/miscLayout';
import { EListLayout } from '@/lib/enums/EListLayout';
import ListItemTextfield from './ListItemTextfield';

type TListItemProps<T extends TListItem> = {
  listId: string;
  itemId: string;
  itemIndex: number;
  storage: MMKV;
  onFocusPlaceholderTextfield: () => void;
  onCreateItem: (listId: string, index: number) => void;
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
  onFocusPlaceholderTextfield,
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
}: TListItemProps<T>) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

  const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();

  const [item, setItem] = useMMKVObject<T>(itemId, storage);

  const textPlatformColor = useMemo(
    () => (item ? onGetRowTextPlatformColor?.(item) : 'label'),
    [item, onGetRowTextPlatformColor]
  );

  const isItemEditable = useMemo(() => (item ? (onGetIsEditable?.(item) ?? true) : true), [item]);

  const isPendingDelete = item
    ? (onGetIsItemDeletingCustom?.(item) ?? onGetIsItemDeletingCallback(item))
    : false;

  const valueStyles: TextStyle = {
    color: PlatformColor(textPlatformColor ?? (isPendingDelete ? 'tertiaryLabel' : 'label')),
    textDecorationLine: isPendingDelete ? 'line-through' : undefined
  };

  const isEditing = textfieldId === item?.id;

  // ================
  //  Event Handlers
  // ================

  function handleContentPress() {
    if (!item || isPendingDelete || !isItemEditable) return;

    if (!onContentClick) {
      onFocusPlaceholderTextfield();
      setTextfieldId(itemId);
      return;
    }
    onContentClick(item);
  }

  function handleCreateUpperItem() {
      onCreateItem(listId, itemIndex);
  }

  function handleCreateLowerItem() {
      onCreateItem(listId, itemIndex + 1);
  }

  // ================
  //  User Interface
  // ================

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

      <View className="flex-row w-full items-center gap-4" style={{ width: SCREEN_WIDTH - LARGE_MARGIN - 22 }}>
        {/* Left Icon */}
        {onGetLeftIcon?.(item)}

        {/* Content */}
        {isEditing ? (
          <ListItemTextfield<T>
            item={item}
            customStyle={valueStyles}
            onFocusPlaceholderTextfield={onFocusPlaceholderTextfield}
            onDeleteItem={onDeleteItem}
            onSetItemInStorage={setItem}
            onValueChange={onValueChange}
            onSaveToExternalStorage={onSaveToExternalStorage}
            onCreateChildTextfield={handleCreateLowerItem}
          />
        ) : (
          <Pressable onPress={handleContentPress} className="flex-1">
            <CustomText
              variant="listRow"
              customStyle={valueStyles}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.value}
            </CustomText>
          </Pressable>
        )}

        {/* Right Icon */}
        {onGetRightIcon?.(item)}
      </View>

      {/* Separator Line */}
      <Pressable onPress={handleCreateLowerItem} className='w-full' style={{ height: EListLayout.NEW_ITEM_TRIGGER_HEIGHT }} />
    </View>
  );
};

export default ListItem;
