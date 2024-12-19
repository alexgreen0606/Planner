import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { FolderItemType } from '../feature/folders/enums';
import ListDisplay from '../feature/folders/components/ListDisplay';
import { FolderProvider } from '../feature/folders/services/FolderProvider';
import { useMMKVListener } from 'react-native-mmkv';
import SortableFolder from '../feature/folders/components/SortableFolder';

interface PageConfig {
  id: string;
  type: FolderItemType;
}

const Folders = () => {
  const { colors } = useTheme();
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: 'root',
    type: FolderItemType.FOLDER
  });

  useMMKVListener((key) => {
    console.log(`Value for "${key}" changed!`)
  })

  const onBackClick = (parentFolderId: string) =>
    setPageConfig({ id: parentFolderId, type: FolderItemType.FOLDER });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView key={pageConfig.id}>
        {pageConfig.type === FolderItemType.FOLDER ? (
          <FolderProvider>
            {/* <FolderDisplay
              folderId={pageConfig.id}
              onBackClick={onBackClick}
              onOpenItem={(id: string, type: FolderItemType) =>
                setPageConfig({ id, type})
              }
            /> */}
            <SortableFolder
              folderId={pageConfig.id}
              onBackClick={onBackClick}
              onOpenItem={(id: string, type: FolderItemType) =>
                setPageConfig({ id, type })
              }
            />
          </FolderProvider>
        ) : (
          <ListDisplay
            listId={pageConfig.id}
            onBackClick={onBackClick}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default Folders;