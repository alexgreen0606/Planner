import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { ReactNode, useState } from 'react';
import { KeyboardAvoidingView, RefreshControl, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DraggableList } from "draggable-list";

import useSortableMmkvList from '@/hooks/useSortableMmkvList';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { LARGE_MARGIN } from '@/lib/constants/miscLayout';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';

import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';
import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './icons/customButtons/GlassIconButton';
import PageContainer from './PageContainer';
import FillerView from './views/FillerView';
import { Host } from '@expo/ui/swift-ui';

type TDraggableListPageProps<T extends TListItem, S> = {
  emptyPageLabel: string;
  toolbar?: ReactNode;
  itemIds: string[];
  listId: string;
  storageId: EStorageId;
  storage: MMKV;
  defaultStorageObject?: S;
  addButtonColor?: string;
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

// TODO: calculate this correctly in the future.
const BOTTOM_NAV_HEIGHT = 86;

const DraggableListPage = <T extends TListItem, S>({
  itemIds,
  listId,
  storage,
  emptyPageLabel,
  toolbar,
  addButtonColor = 'systemBlue',
  onIndexChange,
  onCreateItem,
  onDeleteItem,
  ...listItemProps
}: TDraggableListPageProps<T, S>) => {
  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const onScroll = useScrollTracker(listId);
  const headerHeight = useHeaderHeight();
  const pathname = usePathname();
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const { isListEmpty, listHeight, PlaceholderField, onToggleLowerListItem, ListItems } =
    useSortableMmkvList(
      itemIds,
      storage,
      listId,
      onCreateItem,
      onDeleteItem,
      onIndexChange,
      listItemProps
    );

  const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);

  function handleReloadPage() {
    setShowLoadingSymbol(true);
    onReloadPage();
  }

  const canReloadPath = reloadablePaths.some((p) => pathname.includes(p));
  const contentInset = headerHeight - TOP_SPACER;

  return (
    <PageContainer
      emptyPageLabel={emptyPageLabel}
      addButtonColor={addButtonColor}
      toolbar={toolbar}
      isPageEmpty={isListEmpty}
      onAddButtonClick={onToggleLowerListItem}
    >
      <KeyboardAvoidingView behavior='height'>
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
            canReloadPath ? (
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

              <DraggableList
                moveEnabled
              // onMoveItem={handleMoveItem}
              >
                <ListItems />
              </DraggableList>
            </Host>
          </View>

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
      </KeyboardAvoidingView>

      {/* Placeholder Field */}
      <PlaceholderField />
    </PageContainer>
  );
};

export default DraggableListPage;
