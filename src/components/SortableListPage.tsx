import { Host } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useMemo, useState } from 'react';
import { NativeSyntheticEvent } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SortableList, SortableListMoveEvent, SortableListProps } from "sortable-list";

import useCollapsedHeaderSwift from '@/hooks/scrollTracking/useCollapsedHeaderSwift';
import { NULL } from '@/lib/constants/generic';
import { GLASS_BUTTON_SIZE, LARGE_MARGIN, SMALL_MARGIN } from '@/lib/constants/layout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { getValidCssColor } from '@/utils/colorUtils';

import { useExternalDataContext } from '../providers/ExternalDataProvider';
import PageContainer from './PageContainer';

interface IDraggableListPageProps<T extends TListItem> {
  emptyPageLabel: string;
  itemIds: string[];
  listId: string;
  storage: MMKV;
  selectedItemIds: string[];
  accentPlatformColor?: string;
  hasExternalData?: boolean;
  disabledItemIds?: string[];
  listProps?: Partial<SortableListProps>;
  onGetItem: (itemId: string) => T;
  onCreateItem: (index: number) => void;
  onDeleteItem: (item: T) => void;
  onValueChange?: (newValue: string, item: T) => T;
  onIndexChange: (from: number, to: number, listId: string) => void;
  onToggleSelectItem: (item: T) => void;
  onGetItemTextPlatformColorCallback?: (item: T) => string;
  onSaveToExternalStorage?: (item: T) => void;

  // toolbar?: ReactNode; TODO: migrate to new approach
};

const DraggableListPage = <T extends TListItem>({
  itemIds,
  listId,
  storage,
  emptyPageLabel,
  hasExternalData,
  accentPlatformColor = 'systemBlue',
  selectedItemIds,
  disabledItemIds,
  listProps,
  onIndexChange,
  onGetItem,
  onToggleSelectItem,
  onCreateItem,
  onDeleteItem,
  onValueChange,
  onSaveToExternalStorage,
  onGetItemTextPlatformColorCallback
}: IDraggableListPageProps<T>) => {
  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const { onSetIsScrollingDown } = useCollapsedHeaderSwift(listId);
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [focusedId, setFocusedId] = useState<string>(NULL);
  const [focusedItem, setFocusedItem] = useMMKVObject<T>(focusedId, storage);

  const itemValuesMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => [id, onGetItem(id).value]));
  }, [itemIds, focusedItem?.value]);

  const itemTextColorsMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => {
      const item = onGetItem(id);
      const itemTextColor = getValidCssColor(onGetItemTextPlatformColorCallback?.(item) ?? 'label')!;
      return [id, itemTextColor];
    }));
  }, [itemIds, onGetItemTextPlatformColorCallback]);

  function handleIndexChange({ nativeEvent: { from, to } }: NativeSyntheticEvent<SortableListMoveEvent>) {
    onIndexChange(from, to, listId);
  }

  function handleFocusChange({ nativeEvent: { id } }: NativeSyntheticEvent<{ id: string | null }>) {
    setFocusedId(id ?? NULL);
  }

  function handleIsScrollingDown({ nativeEvent: { isScrollingDown } }: NativeSyntheticEvent<{ isScrollingDown: boolean }>) {
    onSetIsScrollingDown(isScrollingDown);
  }

  function handleDeleteItem({ nativeEvent: { id } }: NativeSyntheticEvent<{ id: string }>) {
    const item = onGetItem(id);
    onDeleteItem(item);
  }

  function handleToggleItem({ nativeEvent: { id } }: NativeSyntheticEvent<{ id: string }>) {
    const item = onGetItem(id);
    onToggleSelectItem(item);
  }

  // Debounced to call 1 second after key press, or immediately on blur.
  function handleValueChange({ nativeEvent: { value } }: NativeSyntheticEvent<{ value: string }>) {
    setFocusedItem((prev) => {
      if (!prev) return prev;

      let newItem = { ...prev };
      if (onValueChange) {
        newItem = onValueChange(value, newItem);
      } else {
        newItem.value = value;
      };

      // External storage save.
      onSaveToExternalStorage?.(newItem);

      // Local storage save.
      return newItem;
    });
  }

  function handleCreateItem({ nativeEvent: { baseId, offset } }: NativeSyntheticEvent<{ baseId?: string, offset?: number }>) {
    if (onCreateItem) {
      if (!baseId) {
        onCreateItem(0);
        return;
      }
      const itemIndex = itemIds.indexOf(baseId);
      if (itemIndex === -1) return;
      onCreateItem(itemIndex + (offset ?? 0));
    }
  }

  function onCreateLowerListItem() {
    onCreateItem(itemIds.length);
  }

  const isListEmpty = itemIds.length === 0;
  const contentInset = headerHeight - TOP_SPACER + SMALL_MARGIN;

  return (
    <PageContainer
      emptyPageLabel={emptyPageLabel}
      addButtonColor={accentPlatformColor}
      isPageEmpty={isListEmpty}
      onAddButtonClick={onCreateLowerListItem}
    >
      <Host style={{ flex: 1 }}>
        <SortableList
          focusedId={focusedId}
          toolbarIcons={['clock']}
          sortedItemIds={itemIds}
          topInset={contentInset}
          onScrollChange={handleIsScrollingDown}
          bottomInset={GLASS_BUTTON_SIZE + LARGE_MARGIN * 2}
          itemValueMap={itemValuesMap}
          itemTextColorsMap={itemTextColorsMap}
          selectedItemIds={selectedItemIds}
          disabledItemIds={disabledItemIds ?? []}
          onToggleItem={handleToggleItem}
          onCreateItem={handleCreateItem}
          onValueChange={handleValueChange}
          onFocusChange={handleFocusChange}
          onMoveItem={handleIndexChange}
          accentColor={getValidCssColor(accentPlatformColor)!}
          onDeleteItem={handleDeleteItem}
          {...listProps}
        />
      </Host>
    </PageContainer>
  );
};

export default DraggableListPage;
