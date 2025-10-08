import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import FolderItemActions from '@/components/actions/FolderItemActions';
import useAppTheme from '@/hooks/useAppTheme';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import { getFolderItemFromStorageById } from '@/storage/checklistsStorage';
import { Stack } from 'expo-router';
import { useAtomValue } from 'jotai';
import { PlatformColor } from 'react-native';

// ✅ 

const ChecklistsLayout = () => {
    const { CssColor: { background } } = useAppTheme();

    const itemInTransfer = useAtomValue(transferingFolderItemAtom);

    function getFolderItemId(params: TChecklistsPageParams) {
        return params.checklistId ?? params.folderId ?? EStorageKey.ROOT_FOLDER_KEY;
    }

    function getFolderItemTitle(params: TChecklistsPageParams) {
        const folderItemId = getFolderItemId(params);
        const folderItem = getFolderItemFromStorageById(folderItemId);
        return folderItem.value;
    }

    function getFolderItemPlatformColor(params: TChecklistsPageParams) {
        const folderItemId = getFolderItemId(params);
        const folderItem = getFolderItemFromStorageById(folderItemId);
        return folderItem.platformColor;
    }

    return (
        <Stack
            screenOptions={({ route: { params } }) => ({
                animation: 'ios_from_right',
                contentStyle: { backgroundColor: background },
                headerTransparent: true,
                headerLargeTitle: true,
                headerBackButtonDisplayMode: 'minimal',
                headerTitleStyle: { color: PlatformColor(getFolderItemPlatformColor(params ?? {})) as unknown as string },
                headerTitle: getFolderItemTitle(params ?? {}),
                headerRight: () => getFolderItemId(params ?? {}) === EStorageKey.ROOT_FOLDER_KEY && !!itemInTransfer ? undefined : <FolderItemActions {...params} />
            })}
        >
            <Stack.Screen name='index' />
            <Stack.Screen name='/checklist/[checklistId]' />
            <Stack.Screen name='/folder/[folderId]' />
        </Stack>
    )
};

export default ChecklistsLayout;