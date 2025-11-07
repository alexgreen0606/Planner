import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FolderItemHeader from '@/components/headers/FolderItemHeader/FolderItemHeader';
import RootFolderHeader from '@/components/headers/RootFolderHeader/RootFolderHeader';
import ColorFadeView from '@/components/views/ColorFadeView';
import useAppTheme from '@/hooks/useAppTheme';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';

function getFolderItemId(params: TChecklistsPageParams) {
  return params.checklistId ?? params.folderId ?? EStorageKey.ROOT_FOLDER_KEY;
}

function getHeader(params: TChecklistsPageParams) {
  const folderItemId = getFolderItemId(params);
  if (folderItemId === EStorageKey.ROOT_FOLDER_KEY) {
    return (
      <RootFolderHeader />
    )
  }

  return (
    <FolderItemHeader folderItemId={folderItemId} />
  )
}

const ChecklistsLayout = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const {
    CssColor: { background },
    ColorArray: {
      Screen: { upperDark, upper }
    }
  } = useAppTheme();

  function handleGetHeaderBackground(params: TChecklistsPageParams) {
    const folderItemId = getFolderItemId(params);
    if (folderItemId === EStorageKey.ROOT_FOLDER_KEY) {
      return (
        <ColorFadeView
          totalHeight={TOP_SPACER + EHeaderHeight.ROOT_FOLDER}
          solidHeight={TOP_SPACER + EHeaderHeight.ROOT_FOLDER / 2}
          colors={upper}
        />
      )
    }
    return (
      <ColorFadeView
        totalHeight={TOP_SPACER + EHeaderHeight.FOLDER_ITEM}
        solidHeight={TOP_SPACER + EHeaderHeight.FOLDER_ITEM / 4}
        colors={upperDark}
      />
    )
  }

  return (
    <Stack
      screenOptions={({ route: { params } }) => ({
        header: () => getHeader(params ?? {}),
        headerBackground: () => handleGetHeaderBackground(params ?? {}),
        animation: 'ios_from_right',
        contentStyle: { backgroundColor: background },
        headerTransparent: true,
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="/checklist/[checklistId]" />
      <Stack.Screen name="/folder/[folderId]" />
    </Stack>
  );
};

export default ChecklistsLayout;
