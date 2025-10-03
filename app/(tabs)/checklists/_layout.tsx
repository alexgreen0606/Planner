import useAppTheme from '@/hooks/useAppTheme';
import { FOLDER_ITEM_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { TChecklistsPageParams } from '@/lib/types/routeParams/TChecklistPageParams';
import { getFolderItemFromStorageById } from '@/storage/checklistsStorage';
import { Host, Image } from '@expo/ui/swift-ui';
import { router, Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

// ✅ 

const ChecklistsLayout = () => {
    const { background } = useAppTheme();

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

    return (
        <Stack
            screenOptions={({ route: { params } }) => ({
                animation: 'ios_from_right',
                contentStyle: { backgroundColor: PlatformColor(background) },
                headerTransparent: true,
                headerLargeTitle: true,
                headerBackButtonDisplayMode: 'minimal',
                headerTitleStyle: { color: PlatformColor(getFolderItemPlatformColor(params ?? {})) as unknown as string },
                headerTitle: getFolderItemTitle(params ?? {}),
                headerRight: () => (
                    <Host style={{ height: 35, width: 35 }}>
                        <Image
                            onPress={() => router.push(`${FOLDER_ITEM_MODAL_PATHNAME}/${getFolderItemId(params ?? {})}`)}
                            systemName='pencil'
                            color={PlatformColor('label') as unknown as string}
                        />
                    </Host>
                )
            })}
        >
            <Stack.Screen name='index' />
            <Stack.Screen name='/checklist/[checklistId]' />
            <Stack.Screen name='/folder/[folderId]' />
        </Stack>
    )
};

export default ChecklistsLayout;