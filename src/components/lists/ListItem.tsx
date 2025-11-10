import { useAtom } from 'jotai';
import React, { ReactNode, useMemo } from 'react';
import { PlatformColor, Pressable, TextStyle, useWindowDimensions, View } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

import { textfieldIdAtom } from '@/atoms/textfieldId';
import CustomText from '@/components/text/CustomText';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

import { LARGE_MARGIN } from '@/lib/constants/miscLayout';
import ListItemTextfield from './ListItemTextfield';

type TListItemProps<T extends TListItem> = {
  listId: string;
  itemId: string;
  itemIndex: number;
  isDragging: boolean;
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
  isDragging,
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
    if (!item || isPendingDelete || isDragging || !isItemEditable) return;

    if (!onContentClick) {
      onFocusPlaceholderTextfield();
      setTextfieldId(itemId);
      return;
    }
    onContentClick(item);
  }

  // ================
  //  User Interface
  // ================

  if (!item) return null;

  return (
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
          onCreateChildTextfield={() => onCreateItem(listId, itemIndex + 1)}
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
  );
};

export default ListItem;
