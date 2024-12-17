import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { FolderItemType } from '../feature/sorted_lists/enums';
import FolderDisplay from '../feature/sorted_lists/components/FolderDisplay';
import ListDisplay from '../feature/sorted_lists/components/ListDisplay';
import { ListProvider } from '../foundation/lists/services/ListProvider';
import { FolderProvider } from '../feature/sorted_lists/services/FolderProvider';

interface PageConfig {
  type: FolderItemType;
  id: string;
  renderTrigger: number;
}

const Lists = () => {
  const { colors } = useTheme();
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    type: FolderItemType.FOLDER,
    id: 'root',
    renderTrigger: 1
  });

  const onBackClick = (parentFolderId: string) =>
    setPageConfig({ id: parentFolderId, type: FolderItemType.FOLDER, renderTrigger: 1 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView key={`${pageConfig.id}-${pageConfig.renderTrigger}`}>
        {pageConfig.type === FolderItemType.FOLDER ? (
          <ListProvider>
            <FolderProvider>
              <FolderDisplay
                folderId={pageConfig.id}
                onBackClick={onBackClick}
                onOpenItem={(id: string, type: FolderItemType, triggerRerender?: boolean) =>
                  setPageConfig({ id, type, renderTrigger: triggerRerender ? pageConfig.renderTrigger + 1 : 1 })
                }
              />
            </FolderProvider>
          </ListProvider>
        ) : (
          <ListProvider>
            <ListDisplay
              listId={pageConfig.id}
              onBackClick={onBackClick}
            />
          </ListProvider>
        )}
      </SafeAreaView>
    </View>
  );
};

export default Lists;