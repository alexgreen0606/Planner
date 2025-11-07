import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import ThinLine from '@/components/ThinLine';
import useAppTheme from '@/hooks/useAppTheme';
import useSortableMmkvList from '@/hooks/useSortableMmkvList';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { LARGE_MARGIN } from '@/lib/constants/miscLayout';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useScrollRegistry } from '@/providers/ScrollRegistry';

import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './icons/customButtons/GlassIconButton';
import PageContainer from './PageContainer';
import ColorFadeView from './views/ColorFadeView';
import FillerView from './views/FillerView';
import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';

// ✅

type TDraggableListPageProps<T extends TListItem, S> = {
  emptyPageLabel: string;
  toolbar?: ReactNode;
  stickyHeader?: ReactElement;
  itemIds: string[];
  listId: string;
  storageId: EStorageId;
  storage: MMKV;
  defaultStorageObject?: S;
  rowHeight?: number;
  addButtonColor?: string;
  padHeaderHeight?: boolean;
  onCreateItem: (listId: string, index: number) => void;
  onDeleteItem: (item: T) => void;
  onValueChange?: (newValue: string) => void;
  onIndexChange?: (newIndex: number, prev: T) => void;
  onSaveToExternalStorage?: (item: T) => void;
  onContentClick?: (item: T) => void;
  onGetRowTextPlatformColor?: (item: T) => string;
  onGetIsItemDeletingCustom?: (item: T) => boolean;
  onGetLeftIcon?: (item: T) => ReactNode;
  onGetRightIcon?: (item: T) => ReactNode;
  onGetIsEditable?: (item: T) => boolean;
};

const DraggableListPage = <T extends TListItem, S>({
  itemIds,
  listId,
  storage,
  emptyPageLabel,
  toolbar,
  stickyHeader,
  rowHeight = 40,
  addButtonColor = 'systemBlue',
  padHeaderHeight,
  onIndexChange,
  onCreateItem,
  onDeleteItem,
  ...listItemProps
}: TDraggableListPageProps<T, S>) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const pathname = usePathname();
  const {top: TOP_SPACER} = useSafeAreaInsets();

  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const {
    CssColor: { background },
    ColorArray: {
      Screen: { upper }
    }
  } = useAppTheme();
  const { scrollViewRef, dropProviderRef, isListEmpty, onToggleLowerListItem, ListItems } =
    useSortableMmkvList(
      itemIds,
      rowHeight,
      storage,
      listId,
      onCreateItem,
      onDeleteItem,
      onIndexChange,
      listItemProps
    );

  const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);

  const onScroll = useScrollTracker(listId);

  // TODO: calculate this correctly in the future.
  const BOTTOM_NAV_HEIGHT = 86;

  const canReloadPath = reloadablePaths.some((p) => pathname.includes(p));

  function handleReloadPage() {
    setShowLoadingSymbol(true);
    onReloadPage();
  }

  const contentInset = headerHeight - TOP_SPACER;

  const paddedHeaderScrollProps = padHeaderHeight ? {
contentInset: { top: contentInset },
        contentOffset: { x: 0, y: -contentInset },
        scrollIndicatorInsets: { top: contentInset }
  } : {};

  return (
    <DropProvider ref={dropProviderRef}>
      <PageContainer
        stickyHeader={stickyHeader}
        emptyPageLabel={emptyPageLabel}
        addButtonColor={addButtonColor}
        toolbar={toolbar}
        isPageEmpty={isListEmpty}
        onAddButtonClick={onToggleLowerListItem}
      >
        <Animated.ScrollView
          ref={scrollViewRef}

          // TODO: create custom refresh logic
          refreshControl={
            canReloadPath ? (
              <RefreshControl
                refreshing={showLoadingSymbol && loadingPathnames.has(listId)}
                onRefresh={handleReloadPage}
              />
            ) : undefined
          }
          onScroll={onScroll}
          contentInsetAdjustmentBehavior="always"
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={SCROLL_THROTTLE}

          contentContainerStyle={{
            minHeight: SCREEN_HEIGHT,
            // paddingTop: padHeaderHeight ? headerHeight : 0
          }}


          {...paddedHeaderScrollProps}

          style={{ height: SCREEN_HEIGHT, backgroundColor: background }}
        >
          {/* Header Filler */}
          <FillerView>{stickyHeader}</FillerView>

          {/* List Items */}
          <ListItems />

          {/* Bottom of List Separator */}
          {itemIds.length > 0 && (
            <Pressable onPress={onToggleLowerListItem}>
              <ThinLine />
            </Pressable>
          )}

          <View className="flex-1" />

          {/* Add Button Filler */}
          <FillerView style={{ paddingBottom: LARGE_MARGIN * 2 }}>
            <GlassIconButton
              systemImage="plus"
              isPrimary
              color={addButtonColor}
              onPress={onToggleLowerListItem}
            />
          </FillerView>
        </Animated.ScrollView>
      </PageContainer>
    </DropProvider>
  );
};

export default DraggableListPage;
