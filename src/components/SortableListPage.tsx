import { Host } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeSyntheticEvent, Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SortableList, SortableListMoveEvent, SortableListProps } from "sortable-list";

import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';
import { NULL, SCROLL_THROTTLE } from '@/lib/constants/generic';
import { GLASS_BUTTON_SIZE, LARGE_MARGIN } from '@/lib/constants/layout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

import { EListLayout } from '@/lib/enums/EListLayout';
import { getValidCssColor } from '@/utils/colorUtils';
import { useExternalDataContext } from '../providers/ExternalDataProvider';
import PageContainer from './PageContainer';
import debounce from 'lodash.debounce';

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

  // toolbar?: ReactNode; TODO: migrate to new approach

  // TODO: get these working
  onSaveToExternalStorage?: (item: T) => void;
};

// TODO: calculate this correctly in the future.
const BOTTOM_NAV_HEIGHT = 86;

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
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const onScroll = useScrollTracker(listId);
  const headerHeight = useHeaderHeight();

  const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);

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

  function handleReloadPage() {
    setShowLoadingSymbol(true);
    onReloadPage();
  }

  function handleIndexChange({ nativeEvent: { from, to } }: NativeSyntheticEvent<SortableListMoveEvent>) {
    onIndexChange(from, to, listId);
  }

  function handleFocusChange({ nativeEvent: { id } }: NativeSyntheticEvent<{ id: string | null }>) {
    setFocusedId(id ?? NULL);
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
    console.info('external save', value)
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

  function handleCreateItem({ nativeEvent: { index } }: NativeSyntheticEvent<{ index: number }>) {
    if (onCreateItem) {
      onCreateItem(index);
    }
  }

  function onCreateLowerListItem() {
    onCreateItem(itemIds.length);
  }

  const isListEmpty = itemIds.length === 0;
  const listHeight = EListLayout.ITEM_HEIGHT * itemIds.length + EListLayout.NEW_ITEM_TRIGGER_HEIGHT / 2;
  const contentInset = headerHeight - TOP_SPACER;

  return (
    <PageContainer
      emptyPageLabel={emptyPageLabel}
      addButtonColor={accentPlatformColor}
      isPageEmpty={isListEmpty}
      onAddButtonClick={onCreateLowerListItem}
    >
      <Animated.ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='always'
        scrollEventThrottle={SCROLL_THROTTLE}
        contentInset={{ top: contentInset }}
        contentOffset={{ x: 0, y: -contentInset - TOP_SPACER }}
        scrollIndicatorInsets={{ top: contentInset }}
        contentContainerStyle={{
          minHeight: Math.max(SCREEN_HEIGHT - headerHeight - BOTTOM_NAV_HEIGHT, listHeight + BOTTOM_NAV_HEIGHT),
        }}
        style={{ height: SCREEN_HEIGHT }}
        showsVerticalScrollIndicator

        // TODO: create custom refresh logic
        refreshControl={
          hasExternalData ? (
            <RefreshControl
              refreshing={showLoadingSymbol && loadingPathnames.has(listId)}
              onRefresh={handleReloadPage}
            />
          ) : undefined
        }
      >
        {/* List Content */}
        <View className='w-full px-4' style={{ height: listHeight }}>
          <Host style={{ flex: 1 }}>
            <SortableList
              focusedId={focusedId}
              toolbarIcons={['clock']}
              sortedItemIds={itemIds}
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
        </View>

        {/* Empty Trigger Space */}
        <Pressable
          onPress={onCreateLowerListItem}
          style={{
            // Minimum height must fill space behind the add button.
            minHeight: GLASS_BUTTON_SIZE + LARGE_MARGIN * 2
          }}
          className='flex-1'
        />
      </Animated.ScrollView>
    </PageContainer>
  );
};

export default DraggableListPage;
