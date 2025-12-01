import { Host } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useMemo, useState } from 'react';
import { NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SortableList, SortableListCreateEvent, SortableListMoveEvent, SortableListProps } from "sortable-list";

import useCollapsedHeaderSwift from '@/hooks/scrollTracking/useCollapsedHeaderSwift';
import { GLASS_BUTTON_SIZE, LARGE_MARGIN, SMALL_MARGIN } from '@/lib/constants/layout';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { getValidCssColor } from '@/utils/colorUtils';

import { useExternalDataContext } from '../providers/ExternalDataProvider';
import PageContainer from './PageContainer';
import PlannerChipSets from './headers/PlannerHeader/microComponents/PlannerChipSets';

interface IDraggableListPageProps<T extends TListItem> {
  emptyPageLabel: string;
  itemIds: string[];
  listId: string;
  selectedItemIds: string[];
  accentPlatformColor?: string;
  hasExternalData?: boolean;
  disabledItemIds?: string[];
  listProps?: Partial<SortableListProps>;
  valueRefreshKey?: string;
  snapToIdTrigger?: string;
  onGetItem: (itemId: string) => T;
  onCreateItem: (index: number) => string; // Return the new ID of them item. TODO: needed?
  onDeleteItem: (item: T) => void;
  onValueChange: (item: T, value: string) => void;
  onIndexChange: (from: number, to: number, listId: string) => void;
  onToggleSelectItem: (item: T) => void;
  onGetItemTextPlatformColorCallback?: (item: T) => string;

  // toolbar?: ReactNode; TODO: migrate to new approach
};

const DraggableListPage = <T extends TListItem>({
  itemIds,
  listId,
  emptyPageLabel,
  hasExternalData,
  accentPlatformColor = 'systemBlue',
  selectedItemIds,
  disabledItemIds,
  listProps,
  valueRefreshKey,
  snapToIdTrigger,
  onIndexChange,
  onGetItem,
  onToggleSelectItem,
  onCreateItem,
  onDeleteItem,
  onValueChange,
  onGetItemTextPlatformColorCallback
}: IDraggableListPageProps<T>) => {
  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const { onSetIsScrollingDown } = useCollapsedHeaderSwift(listId);
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [slideToIdTrigger, setSlideToIdTrigger] = useState<string | undefined>();

  const itemValuesMap = useMemo(() => {
    return Object.fromEntries(itemIds.map((id) => [id, onGetItem(id).value]));
  }, [itemIds, valueRefreshKey]);

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
  function handleValueChange({ nativeEvent: { value, id } }: NativeSyntheticEvent<{ value: string, id: string }>) {
    const item = onGetItem(id);
    onValueChange(item, value);
  }

  function handleCreateItem({ nativeEvent: { baseId, offset, shouldSlideTo } }: NativeSyntheticEvent<SortableListCreateEvent>) {
    let newItemIndex = 0;
    if (baseId) {
      const itemIndex = itemIds.indexOf(baseId);
      if (itemIndex === -1) return;
      newItemIndex = itemIndex + (offset ?? 0);
    }

    const newItemId = onCreateItem(newItemIndex);
    if (shouldSlideTo) setSlideToIdTrigger(newItemId);
  }

  const isListEmpty = itemIds.length === 0;
  const contentInset = headerHeight - TOP_SPACER + SMALL_MARGIN;

  return (
    <PageContainer
      emptyPageLabel={emptyPageLabel}
      isPageEmpty={isListEmpty}
    >
      <Host style={{ flex: 1 }}>
        <SortableList
          toolbarIcons={['clock']}
          sortedItemIds={itemIds}
          slideToIdTrigger={slideToIdTrigger}
          snapToIdTrigger={snapToIdTrigger}
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
