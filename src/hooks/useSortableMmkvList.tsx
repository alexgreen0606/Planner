import { ReactNode, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { MMKV } from 'react-native-mmkv';

import ListItem from '@/components/lists/ListItem';
import { EListLayout } from '@/lib/enums/EListLayout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

import useTextfieldItemAs from './useTextfieldItemAs';

const useSortableMmkvList = <T extends TListItem, S>(
  itemIds: string[],
  storage: MMKV,
  listId: string,
  onCreateItem: (index: number) => void,
  onDeleteItem: (item: T) => void,
  listItemProps?: {
    defaultStorageObject?: S | undefined;
    onValueChange?: ((newValue: string) => void) | undefined;
    onSaveToExternalStorage?: ((item: T) => void) | undefined;
    onContentClick?: ((item: T) => void) | undefined;
    onGetRowTextPlatformColor?: ((item: T) => string) | undefined;
    onGetIsItemDeletingCustom?: ((item: T) => boolean) | undefined;
    onGetLeftIcon?: ((item: T) => React.ReactNode) | undefined;
    onGetRightIcon?: ((item: T) => ReactNode) | undefined;
    onGetIsEditable?: ((item: T) => boolean) | undefined;
  }
) => {
  const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);

  // Placeholder textfield to keep the textfield focused when toggling between list items.
  const placeholderInputRef = useRef<TextInput>(null);
  const PlaceholderField = () => (
    <TextInput
      ref={placeholderInputRef}
      returnKeyType="done"
      className="absolute w-1 h-1 left-[9999]"
      autoCorrect={false}
    />
  );

  function focusPlaceholder() {
    placeholderInputRef.current?.focus();
  }

  // Track the ordering of IDs to pass to the list function.
  // This sort order will be out of sync with the UI and MMKV once a user drags items around.
  const [updatedList, setUpdatedList] = useState(itemIds);
  useEffect(() => {
    if (itemIds.length !== updatedList.length) {
      setUpdatedList(itemIds);
    }
  }, [itemIds]);

  const ListItems = () => updatedList.map((itemId, index) => (
    <ListItem<T>
      itemIndex={index}
      listId={listId}
      itemId={itemId}
      storage={storage}
      onFocusPlaceholderTextfield={focusPlaceholder}
      onCreateItem={onCreateItem}
      onDeleteItem={onDeleteItem}
      {...listItemProps}
      key={itemId}
    />
  ));

  function handleToggleLowerListItem() {
    if (!textfieldItem) {
      // Open a textfield at the bottom of the list.
      onCreateItem(itemIds.length);
      return;
    }

    onCloseTextfield();

    if (textfieldItem.value.trim() === '') {
      onDeleteItem(textfieldItem);
    }
  }

  const isListEmpty = updatedList.length === 0;

  return {
    isListEmpty,
    listHeight: EListLayout.ITEM_HEIGHT * updatedList.length,
    PlaceholderField,
    onToggleLowerListItem: handleToggleLowerListItem,
    ListItems
  };
};

export default useSortableMmkvList;
