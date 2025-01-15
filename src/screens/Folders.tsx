import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { FolderItemType } from '../feature/folders/enums';
import SortedFolder from '../feature/folders/components/SortedFolder';
import SortedList from '../feature/folders/components/SortedList';
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
          <SortedFolder
            folderId={pageConfig.id}
            onBackClick={onBackClick}
            onOpenItem={(id: string, type: FolderItemType) =>
              setPageConfig({ id, type })
            }
          />
        ) : (
          <SortedList
            listId={pageConfig.id}
            onBackClick={onBackClick}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default Folders;