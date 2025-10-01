import FolderItemActions from '@/components/actions/FolderItemActions';
import useAppTheme from '@/hooks/useAppTheme';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import { getFolderItemFromStorageById } from '@/storage/checklistsStorage';
import { Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

// ✅ 

const ChecklistsLayout = () => {
    const { background } = useAppTheme();

    // function handleTransferToParent() {
    //     if (!itemInTransfer) return;

    //     const currentFolder = getFolderItemFromStorageById(folderItemId);

    //     const parentFolder = getFolderItemFromStorageById(currentFolder.listId);
    //     parentFolder.itemIds.push(itemInTransfer.id);
    //     saveFolderItemToStorage(parentFolder);

    //     saveFolderItemToStorage({ ...currentFolder, itemIds: currentFolder.itemIds.filter((id) => id !== itemInTransfer.id) });
    //     saveFolderItemToStorage({ ...itemInTransfer, listId: currentFolder.listId });

    //     setItemInTransfer(null);
    // }

    function getFolderItemTitle({ checklistId, folderId }: TChecklistsPageParams) {
        const folderItemId = checklistId ?? folderId ?? EStorageKey.ROOT_FOLDER_KEY;
        const folderItem = getFolderItemFromStorageById(folderItemId);
        return folderItem.value;
    }

    function getFolderItemPlatformColor({ checklistId, folderId }: TChecklistsPageParams) {
        const folderItemId = checklistId ?? folderId ?? EStorageKey.ROOT_FOLDER_KEY;
        const folderItem = getFolderItemFromStorageById(folderItemId);
        return folderItem.platformColor;
    }

    return (
        <Stack
            screenOptions={({ route }) => ({
                animation: 'ios_from_right',
                contentStyle: { backgroundColor: PlatformColor(background) },
                headerTransparent: true,
                headerLargeTitle: true,
                headerBackButtonDisplayMode: 'minimal',
                headerTitleStyle: { color: PlatformColor(getFolderItemPlatformColor(route.params ?? {})) as unknown as string },
                headerTitle: getFolderItemTitle(route.params ?? {}),
                headerRight: () => <FolderItemActions {...route.params} />,
            })}
        >
            <Stack.Screen name='index' />
            <Stack.Screen name='/checklist/[checklistId]' />
            <Stack.Screen name='/folder/[folderId]' />
        </Stack>
    )
};

export default ChecklistsLayout;