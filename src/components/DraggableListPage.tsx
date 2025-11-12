import { Host } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import { SortableList } from "sortable-list";
import React, { ReactNode, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';
import useSortableMmkvList from '@/hooks/useSortableMmkvList';
import { SCROLL_THROTTLE } from '@/lib/constants/generic';
import { LARGE_MARGIN } from '@/lib/constants/layout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './buttons/GlassIconButton';
import PageContainer from './PageContainer';
import FillerView from './views/FillerView';

interface IDraggableListPageProps<T extends TListItem, S> {
  emptyPageLabel: string;
  toolbar?: ReactNode;
  itemIds: string[];
  listId: string;
  storageId: EStorageId;
  storage: MMKV;
  defaultStorageObject?: S;
  addButtonColor?: string;
  hasExternalData?: boolean;
  onCreateItem: (index: number) => void;
  onDeleteItem: (item: T) => void;
  onValueChange?: (newValue: string) => void;
  onIndexChange?: (from: number, to: number, listId: string) => void;
  onSaveToExternalStorage?: (item: T) => void;
  onContentClick?: (item: T) => void;
  onGetRowTextPlatformColor?: (item: T) => string;
  onGetIsItemDeletingCustom?: (item: T) => boolean;
  onGetLeftIcon?: (item: T) => ReactNode;
  onGetRightIcon?: (item: T) => ReactNode;
  onGetIsEditable?: (item: T) => boolean;
};

// TODO: calculate this correctly in the future.
const BOTTOM_NAV_HEIGHT = 86;

const DraggableListPage = <T extends TListItem, S>({
  itemIds,
  listId,
  storage,
  emptyPageLabel,
  toolbar,
  hasExternalData,
  addButtonColor = 'systemBlue',
  onIndexChange,
  onCreateItem,
  onDeleteItem,
  ...listItemProps
}: IDraggableListPageProps<T, S>) => {
  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const onScroll = useScrollTracker(listId);
  const headerHeight = useHeaderHeight();
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const { isListEmpty, listHeight, onToggleLowerListItem, ListItems } =
    useSortableMmkvList(
      itemIds,
      storage,
      listId,
      onCreateItem,
      onDeleteItem,
      listItemProps
    );

  const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);

  function handleReloadPage() {
    setShowLoadingSymbol(true);
    onReloadPage();
  }

  const contentInset = headerHeight - TOP_SPACER;

  return (
    <PageContainer
      emptyPageLabel={emptyPageLabel}
      addButtonColor={addButtonColor}
      toolbar={toolbar}
      isPageEmpty={isListEmpty}
      onAddButtonClick={onToggleLowerListItem}
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
        {/* Content */}
        <View className='w-full p-4' style={{ height: listHeight + LARGE_MARGIN * 2 }}>
          <Host style={{ flex: 1 }}>
            <SortableList onMoveItem={({ from, to }) => onIndexChange?.(from, to, listId)}>
              <ListItems />
            </SortableList>
          </Host>
        </View>

        <Pressable className='flex-1' onPress={onToggleLowerListItem} />

        {/* Add Button Filler */}
        <FillerView style={{ paddingVertical: LARGE_MARGIN }}>
          <GlassIconButton
            systemImage="plus"
            isPrimary
            color={addButtonColor}
            onPress={onToggleLowerListItem}
          />
        </FillerView>
      </Animated.ScrollView>
    </PageContainer>
  );
};

export default DraggableListPage;
