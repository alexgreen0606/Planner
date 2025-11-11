import { Host, List } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';
import useFolderItem from '@/hooks/useFolderItem';
import { NULL, SCROLL_THROTTLE } from '@/lib/constants/generic';
import { EListLayout } from '@/lib/enums/EListLayout';
import { EModalBasePath } from '@/lib/enums/EModalBasePath';
import { EStorageId } from '@/lib/enums/EStorageId';

import FolderItem from './FolderItem';
import PageContainer from './PageContainer';

interface IFolderPageProps {
  folderId: string;
};

// TODO: calculate this correctly in the future.
const BOTTOM_NAV_HEIGHT = 86;

const FolderPage = ({ folderId }: IFolderPageProps) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const onScroll = useScrollTracker(folderId);
  const headerHeight = useHeaderHeight();
  const router = useRouter();

  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const {
    folderItem: folder,
    itemIds,
    isTransferMode,
    transferingItem,
    onUpdateItemIndex,
    onEndTransfer
  } = useFolderItem(folderId, folderItemStorage);

  // Track the ordering of IDs to pass to the list function.
  // This sort order will be out of sync with the UI and MMKV once a user drags items around.
  const [updatedList, setUpdatedList] = useState(itemIds);
  useEffect(() => {
    if (itemIds.length !== updatedList.length) {
      setUpdatedList(itemIds);
    }
  }, [itemIds]);

  function handleOpenNewItemModal() {
    if (!folder) return;
    router.push(`${EModalBasePath.FOLDER_ITEM_MODAL_PATHNAME}/${folder.id}/${NULL}`);
  }

  const contentInset = headerHeight - TOP_SPACER;
  const listHeight = updatedList.length * EListLayout.ITEM_HEIGHT;

  return (
    <PageContainer
      emptyPageLabel="No contents"
      isPageEmpty={itemIds.length === 0}
      addButtonColor={folder?.platformColor}
      onAddButtonClick={handleOpenNewItemModal}
    >
      <Animated.ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior='automatic'
        scrollEventThrottle={SCROLL_THROTTLE}
        contentInset={{ top: contentInset }}
        contentOffset={{ x: 0, y: -contentInset }}
        scrollIndicatorInsets={{ top: contentInset, bottom: BOTTOM_NAV_HEIGHT }}
        contentContainerStyle={{
          minHeight: Math.max(SCREEN_HEIGHT - headerHeight - BOTTOM_NAV_HEIGHT, listHeight + BOTTOM_NAV_HEIGHT),
        }}
        style={{ height: SCREEN_HEIGHT }}
        showsVerticalScrollIndicator
      >
        <Host style={{ height: listHeight, width: '100%' }}>
          <List
            moveEnabled
            scrollEnabled={false}
            onMoveItem={onUpdateItemIndex}
            listStyle='plain'
          >
            {updatedList.map((id) => (
              <FolderItem
                parentFolder={folder}
                storage={folderItemStorage}
                itemId={id}
                onEndTransfer={onEndTransfer}
                transferingItem={transferingItem}
                isTransferMode={isTransferMode}
                key={id}
              />
            ))}
          </List>
        </Host>
        <Pressable className='flex-1' onPress={handleOpenNewItemModal} />
      </Animated.ScrollView>
    </PageContainer>
  );
};

export default FolderPage;
