import { Host } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useMemo, useState } from 'react';
import { NativeSyntheticEvent, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SortableList, SortableListMoveEvent } from "sortable-list";

import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';
import { NULL, SCROLL_THROTTLE } from '@/lib/constants/generic';
import { LARGE_MARGIN } from '@/lib/constants/layout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

import { EListLayout } from '@/lib/enums/EListLayout';
import { getValidCssColor } from '@/utils/colorUtils';
import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './buttons/GlassIconButton';
import PageContainer from './PageContainer';
import FillerView from './views/FillerView';

interface IDraggableListPageProps<T extends TListItem> {
  emptyPageLabel: string;
  itemIds: string[];
  listId: string;
  storage: MMKV;
  accentPlatformColor?: string;
  hasExternalData?: boolean;
  onGetItem: (itemId: string) => T;
  onCreateItem: (index: number) => void;
  onDeleteItem: (item: T) => void;
  onValueChange?: (newValue: string, item: T) => T;
  onIndexChange: (from: number, to: number, listId: string) => void;
  onToggleSelectItem: (item: T) => void;

  // toolbar?: ReactNode; TODO: migrate to new approach

  // TODO: get these working
  onSaveToExternalStorage?: (item: T) => void;

  onGetIsItemSelectedCallback?: (item: T) => boolean;
  onGetIsItemSelectDisabledCallback?: (item: T) => boolean;
  onGetItemTextPlatformColorCallback?: (item: T) => string;
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
  onIndexChange,
  onGetItem,
  onToggleSelectItem,
  onCreateItem,
  onDeleteItem,
  onValueChange,
  onGetIsItemSelectDisabledCallback,
  onGetIsItemSelectedCallback,
  onGetItemTextPlatformColorCallback
}: IDraggableListPageProps<T>) => {
  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const onScroll = useScrollTracker(listId);
  const headerHeight = useHeaderHeight();
  const { top: TOP_SPACER } = useSafeAreaInsets();

  const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);
  const [focusedId, setFocusedId] = useState<string>(NULL);
  const [item, setItem] = useMMKVObject<T>(focusedId, storage);

  const itemValuesMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => [id, onGetItem(id).value]));
  }, [itemIds, item?.value]);

  const itemTextColorsMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => {
      const item = onGetItem(id);
      const itemTextColor = getValidCssColor(onGetItemTextPlatformColorCallback?.(item) ?? 'label')!;
      return [id, itemTextColor];
    }));
  }, [itemIds, onGetItemTextPlatformColorCallback]);

  const selectedItemsMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => {
      const item = onGetItem(id);
      const isSelected = onGetIsItemSelectedCallback?.(item) ?? false;
      return [id, isSelected];
    }));
  }, [itemIds, onGetIsItemSelectedCallback]);

  const disabledSelectItemsMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => {
      const item = onGetItem(id);
      const isDisabled = onGetIsItemSelectDisabledCallback?.(item) ?? false;
      return [id, isDisabled];
    }));
  }, [itemIds, onGetIsItemSelectDisabledCallback]);

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

  function handleValueChange({ nativeEvent: { value } }: NativeSyntheticEvent<{ value: string }>) {
    setItem((prev) => {
      if (!prev) return prev;
      if (onValueChange) return onValueChange(value, prev);
      return { ...prev, value };
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
  const listHeight = EListLayout.ITEM_HEIGHT * itemIds.length + EListLayout.NEW_ITEM_TRIGGER_HEIGHT;
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
          minHeight: SCREEN_HEIGHT - headerHeight - BOTTOM_NAV_HEIGHT // Math.max(SCREEN_HEIGHT - headerHeight - BOTTOM_NAV_HEIGHT, listHeight + LARGE_MARGIN * 2 + BOTTOM_NAV_HEIGHT),
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
        {/* Content */}
        {/* <View className='w-full p-4' style={{ height: listHeight + LARGE_MARGIN * 2 + EListLayout.NEW_ITEM_TRIGGER_HEIGHT }}
        > */}
        <Host style={{ flex: 1 }}>
          <SortableList
            focusedId={focusedId}
            toolbarIcons={['clock']}
            sortedItemIds={itemIds}
            itemValueMap={itemValuesMap}
            itemTextColorsMap={itemTextColorsMap}
            selectedItemMap={selectedItemsMap}
            disabledSelectItemMap={disabledSelectItemsMap}
            onToggleItem={handleToggleItem}
            onCreateItem={handleCreateItem}
            onValueChange={handleValueChange}
            onFocusChange={handleFocusChange}
            onMoveItem={handleIndexChange}
            accentColor={getValidCssColor(accentPlatformColor)!}
            onDeleteItem={handleDeleteItem}
          />
        </Host>
        {/* </View> */}

        <Pressable className='flex-1' onPress={onCreateLowerListItem} />

        {/* Add Button Filler */}
        <FillerView style={{ paddingVertical: LARGE_MARGIN }}>
          <GlassIconButton
            systemImage="plus"
            isPrimary
            color={accentPlatformColor}
            onPress={() => null}
          />
        </FillerView>
      </Animated.ScrollView>
    </PageContainer>
  );
};

export default DraggableListPage;
