import { transferingFolderItemAtom } from "@/atoms/transferingFolderItem";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { selectableColors } from "@/lib/constants/colors";
import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { deleteFolderItemAndChildren } from "@/utils/checklistUtils";
import { useSetAtom } from "jotai";
import { Alert, TouchableOpacity } from "react-native";
import { useMMKV } from "react-native-mmkv";
import GenericIcon from "../icon";
import ToggleFolderItemTypeIcon from "../icon/ToggleFolderItemTypeIcon";
import TransferFolderIcon from "../icon/TransferFolderIcon";
import ListToolbar from "../lists/components/ListToolbar";
import { useEffect } from "react";

// ✅ 

const FolderItemToolbar = () => {
    const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });

    const setTransferingItem = useSetAtom(transferingFolderItemAtom);

    const {
        textfieldItem: focusedItem,
        textfieldId: focusedItemId,
        onSetTextfieldItem: onSetFocusedItem,
        onCloseTextfield: onCloseFocusedItem
    } = useTextfieldItemAs<IFolderItem>(itemStorage);

    const iconSet = [
        [( // Delete Icon
            <GenericIcon
                type='trash'
                platformColor='label'
                onClick={() => {
                    if (!focusedItem) return;

                    onCloseFocusedItem();

                    if (focusedItem.value.trim() === '') return;

                    const title = `Delete ${focusedItem.type}?`;
                    const hasNestedItems = focusedItem.itemIds.length > 0;

                    let message = "";
                    if (hasNestedItems) {
                        message += `This ${focusedItem.type} has ${focusedItem.itemIds.length} items. Deleting is irreversible and will lose all inner contents.`;
                    } else {
                        message += `Would you like to delete this ${focusedItem.type}?`;
                    }

                    Alert.alert(title, message, [
                        {
                            text: "Cancel",
                            style: "cancel",
                        },
                        {
                            text: hasNestedItems ? "Force Delete" : "Delete",
                            style: "destructive",
                            onPress: () => {
                                onCloseFocusedItem();
                                deleteFolderItemAndChildren(focusedItem);
                            },
                        },
                    ]);
                }}
            />
        )],
        [( // Type Toggle
            <TouchableOpacity
                onPress={toggleFocusedItemType}
                activeOpacity={focusedItem && focusedItem.itemIds.length === 0 ? 0 : 1}
            >
                <ToggleFolderItemTypeIcon
                    disabled={!!focusedItem && focusedItem.itemIds.length > 0}
                    currentType={focusedItem?.type ?? EFolderItemType.FOLDER}
                />
            </TouchableOpacity>
        )],
        [( // Transfer
            <TouchableOpacity
                onPress={beginFocusedItemTransfer}
                activeOpacity={focusedItem && focusedItem.value.length === 0 ? 1 : 0}
            >
                <TransferFolderIcon disabled={!!focusedItem && focusedItem.value.length === 0} />
            </TouchableOpacity>
        )], // Color
        Object.values(selectableColors).map(color => (
            <GenericIcon
                type={focusedItem && focusedItem?.platformColor === color ? 'circleFilled' : 'circle'}
                platformColor={color}
                onClick={() => changeFocusedItemColor(color)}
            />
        )),
    ];

    // Clear the transfering item if a new item begins editing.
    useEffect(() => {
        if (focusedItemId) {
            setTransferingItem(null);
        }
    }, [focusedItemId]);

    function beginFocusedItemTransfer() {
        if (!focusedItem) return;

        setTransferingItem({ ...focusedItem });
        onCloseFocusedItem();
    }

    function changeFocusedItemColor(platformColor: string) {
        onSetFocusedItem((prev) => {
            if (!prev) return prev;
            return { ...prev, platformColor };
        });
    }

    function toggleFocusedItemType() {
        if (!focusedItem) return;
        onSetFocusedItem((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                type:
                    prev.type === EFolderItemType.FOLDER ? EFolderItemType.LIST : EFolderItemType.FOLDER
            };
        });
    }

    return (
        <ListToolbar
            hide={focusedItem?.storageId !== EStorageId.FOLDER_ITEM}
            iconSet={iconSet}
        />
    )
};

export default FolderItemToolbar;