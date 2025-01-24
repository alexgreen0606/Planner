import React, { useState } from 'react';
import { View } from 'react-native';
import SortedFolder from '../feature/folders/components/SortedFolder';
import SortedList from '../feature/folders/components/SortedList';
import { SortableListProvider } from '../foundation/sortedLists/services/SortableListProvider';
import globalStyles from '../foundation/theme/globalStyles';
import { FolderItemType, ROOT_FOLDER_ID } from '../feature/folders/utils';

interface PageConfig {
  id: string;
  type: FolderItemType;
}

const Lists = () => {
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: ROOT_FOLDER_ID,
    type: FolderItemType.FOLDER
  });

  const onBackClick = (listId: string) =>
    setPageConfig({ id: listId, type: FolderItemType.FOLDER });

  return (
    <View key={pageConfig.id} style={globalStyles.backdrop}>
      {pageConfig.type === FolderItemType.FOLDER ? (
        <SortableListProvider>
          <SortedFolder
            folderId={pageConfig.id}
            onBackClick={onBackClick}
            onOpenItem={(id: string, type: FolderItemType) =>
              setPageConfig({ id, type })
            }
          />
        </SortableListProvider>
      ) : (
        <SortableListProvider>
          <SortedList
            listId={pageConfig.id}
            onBackClick={onBackClick}
          />
        </SortableListProvider>
      )}
    </View>
  );
};

export default Lists;