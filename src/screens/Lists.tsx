import React, { useState } from 'react';
import { View } from 'react-native';
import SortedFolder from '../feature/folders/components/SortedFolder';
import SortedList from '../feature/folders/components/SortedList';
import { SortableListProvider } from '../foundation/sortedLists/services/SortableListProvider';
import globalStyles from '../foundation/theme/globalStyles';
import { FolderItemType } from '../feature/folders/utils';

interface PageConfig {
  id: string;
  type: FolderItemType;
}

const Lists = () => {
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: 'root',
    type: FolderItemType.FOLDER
  });

  const onBackClick = (parentFolderId: string) =>
    setPageConfig({ id: parentFolderId, type: FolderItemType.FOLDER });

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
        <SortedList
          listId={pageConfig.id}
          onBackClick={onBackClick}
        />
      )}
    </View>
  );
};

export default Lists;