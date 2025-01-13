import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { FolderItemType } from '../feature/folders/enums';
import SortableFolder from '../feature/folders/components/SortableFolder';
import SortableList from '../feature/folders/components/SortableList';
import colors from '../foundation/theme/colors';
import PageLabel from '../foundation/ui/text/PageLabel';

interface PageConfig {
  id: string;
  type: FolderItemType;
}

const Folders = () => {
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: 'root',
    type: FolderItemType.FOLDER
  });

  const onBackClick = (parentFolderId: string) =>
    setPageConfig({ id: parentFolderId, type: FolderItemType.FOLDER });

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <SafeAreaView key={pageConfig.id}>
        {/* <PageLabel
          label='Lists'
          iconConfig={{
            type: 'Entypo',
            name: 'folder',
            size: 26,
            color: colors.blue
          }}
        /> */}
        {pageConfig.type === FolderItemType.FOLDER ? (
          <SortableFolder
            folderId={pageConfig.id}
            onBackClick={onBackClick}
            onOpenItem={(id: string, type: FolderItemType) =>
              setPageConfig({ id, type })
            }
          />
        ) : (
          <SortableList
            listId={pageConfig.id}
            onBackClick={onBackClick}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default Folders;