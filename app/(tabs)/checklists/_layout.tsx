import { Stack } from 'expo-router';
import { useAtomValue } from 'jotai';

import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import FolderItemActions from '@/components/actions/FolderItemActions';
import useAppTheme from '@/hooks/useAppTheme';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import { getFolderItemFromStorageById } from '@/storage/checklistsStorage';
import { getValidCssColor } from '@/utils/colorUtils';

function getChecklistId(params: TChecklistsPageParams) {
  return params.checklistId ?? params.folderId ?? EStorageKey.ROOT_FOLDER_KEY;
}

function getChecklistTitle(params: TChecklistsPageParams) {
  const folderItemId = getChecklistId(params);
  const folderItem = getFolderItemFromStorageById(folderItemId);
  return folderItem.value;
}

function getChecklistColor(params: TChecklistsPageParams) {
  const folderItemId = getChecklistId(params);
  const folderItem = getFolderItemFromStorageById(folderItemId);
  return getValidCssColor(folderItem.platformColor);
}

const ChecklistsLayout = () => {
  const {
    CssColor: { background }
  } = useAppTheme();

  const itemInTransfer = useAtomValue(transferingFolderItemAtom);

  return (
    <Stack
      screenOptions={({ route: { params } }) => ({
        headerTitle: getChecklistTitle(params ?? {}),
        headerRight: () =>
          getChecklistId(params ?? {}) === EStorageKey.ROOT_FOLDER_KEY &&
          !!itemInTransfer ? undefined : (
            <FolderItemActions {...params} />
          ),
        animation: 'ios_from_right',
        headerBackButtonDisplayMode: 'minimal',
        headerTitleStyle: { color: getChecklistColor(params ?? {}) },
        contentStyle: { backgroundColor: background },
        headerTransparent: true,
        headerLargeTitle: true
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="/checklist/[checklistId]" />
      <Stack.Screen name="/folder/[folderId]" />
    </Stack>
  );
};

export default ChecklistsLayout;
