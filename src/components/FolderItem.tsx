import { useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, Pressable, useWindowDimensions, View } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';

import CustomText from '@/components/text/CustomText';
import { NULL } from '@/lib/constants/generic';
import { LARGE_MARGIN } from '@/lib/constants/layout';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EModalBasePath } from '@/lib/enums/EModalBasePath';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getFolderItemFromStorageById, saveFolderItemToStorage } from '@/storage/checklistsStorage';

import FolderItemButton from './buttons/FolderItemButton';

interface IFolderItemProps {
    itemId: string;
    storage: MMKV;
    transferingItem: IFolderItem | null;
    isTransferMode: boolean;
    parentFolder: IFolderItem | undefined;
    onEndTransfer: () => void;
};

const FolderItem = ({
    itemId,
    storage,
    transferingItem,
    isTransferMode,
    parentFolder,
    onEndTransfer
}: IFolderItemProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

    const [item] = useMMKVObject<IFolderItem>(itemId, storage);

    const isItemClickable = !isTransferMode || transferingItem?.id !== itemId && item?.type === EFolderItemType.FOLDER;
    const textPlatformColor = isItemClickable ? 'label' : 'tertiaryLabel';

    function handleItemClick() {
        if (!item) return;

        if (isTransferMode) {
            if (item.type === EFolderItemType.FOLDER && item.id !== transferingItem?.id) {
                transferToSiblingFolder(item);
            }
            onEndTransfer();
            return;
        }

        if (item.type === EFolderItemType.FOLDER) {
            router.push(`checklists/folder/${item.id}`);
        } else if (item.type === EFolderItemType.CHECKLIST) {
            router.push(`checklists/checklist/${item.id}`);
        }
    }

    function transferToSiblingFolder(destinationItem: IFolderItem) {
        if (!parentFolder || !transferingItem) return;

        // TODO: dont allow transfer into self

        const childFolder = getFolderItemFromStorageById(destinationItem.id);
        childFolder.itemIds.push(transferingItem.id);
        saveFolderItemToStorage(childFolder);

        saveFolderItemToStorage({
            ...parentFolder,
            itemIds: parentFolder.itemIds.filter((id) => id !== transferingItem.id)
        });
        saveFolderItemToStorage({ ...transferingItem, listId: destinationItem.id });
    }

    if (!item) return null;

    return (
        <View className="flex-row items-center gap-4 relative" style={{ width: SCREEN_WIDTH - LARGE_MARGIN - 24 }}>
            {/* Type Icon */}
            <FolderItemButton
                item={item}
                disabled={!isItemClickable}
                onClick={() => router.push(`${EModalBasePath.FOLDER_ITEM_MODAL_PATHNAME}/${NULL}/${itemId}`)}
            />

            {/* Title */}
            <Pressable onPress={handleItemClick} className="flex-1">
                <CustomText
                    variant="listRow"
                    customStyle={{
                        color: PlatformColor(textPlatformColor)
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {item.value}
                </CustomText>
            </Pressable>

            {/* Child Count */}
            <CustomText variant='pageSubHeader'>
                {String(item.itemIds.length)}
            </CustomText>
        </View>
    );
};

export default FolderItem;
