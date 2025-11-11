import { Host, List } from '@expo/ui/swift-ui';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScrollTracker } from '@/hooks/collapsibleHeaders/useScrollTracker';
import useFolderItem from '@/hooks/useFolderItem';
import { NULL, SCROLL_THROTTLE } from '@/lib/constants/generic';
import { EListLayout } from '@/lib/enums/EListLayout';
import { EModalBasePath } from '@/lib/enums/EModalBasePath';
import { EStorageId } from '@/lib/enums/EStorageId';
import { updateFolderOrChecklistItemIndex } from '@/utils/checklistUtils';

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

  function handleMoveItem(from: number, to: number) {
    updateFolderOrChecklistItemIndex(from, to, folderId);
  }

  const contentInset = headerHeight - TOP_SPACER;

  return (
    <PageContainer
      emptyPageLabel="No contents"
      isPageEmpty={itemIds.length === 0}
      addButtonColor={folder?.platformColor}
      onAddButtonClick={() => folder && router.push(`${EModalBasePath.FOLDER_ITEM_MODAL_PATHNAME}/${folder.id}/${NULL}`)}
    >
      <Animated.ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior='automatic'
        scrollEventThrottle={SCROLL_THROTTLE}
        contentInset={{ top: contentInset }}
        contentOffset={{ x: 0, y: -contentInset }}
        scrollIndicatorInsets={{ top: contentInset, bottom: BOTTOM_NAV_HEIGHT }}
        contentContainerStyle={{
          minHeight: Math.max(SCREEN_HEIGHT - headerHeight - BOTTOM_NAV_HEIGHT, updatedList.length * EListLayout.ITEM_HEIGHT + BOTTOM_NAV_HEIGHT),
        }}
        style={{ height: SCREEN_HEIGHT }}
        showsVerticalScrollIndicator
      >
        <Host style={{ flex: 1 }}>
          <List
            moveEnabled
            scrollEnabled={false}
            onMoveItem={handleMoveItem}
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
      </Animated.ScrollView>
    </PageContainer>
  );
};

export default FolderPage;
