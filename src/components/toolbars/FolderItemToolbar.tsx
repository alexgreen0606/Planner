import { transferingFolderItemAtom } from "@/atoms/transferingFolderItem";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { selectableColors } from "@/lib/constants/colors";
import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { deleteFolderItemAndChildren } from "@/utils/checklistUtils";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useMMKV } from "react-native-mmkv";
import IconButton from "../icons/IconButton";
import ToggleFolderItemTypeButton from "../icons/customButtons/ToggleFolderItemTypeButton";
import TransferFolderIcon from "../icons/customButtons/TransferFolderButton";
import ListToolbar from "../lists/components/ListToolbar";

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
                    prev.type === EFolderItemType.FOLDER ? EFolderItemType.CHECKLIST : EFolderItemType.FOLDER
            };
        });
    }

    return (
        <ListToolbar iconSet={[
            [( // Delete Icon
                <IconButton
                    name='trash'
                    color='label'
                    size={22}
                    onClick={() => {
                        if (!focusedItem) return;

                        onCloseFocusedItem();

                        if (focusedItem.value.trim() === '') return;

                        const hasChildren = focusedItem.itemIds.length > 0;
                        const message = `Would you like to delete this ${focusedItem.type}?${hasChildren ? ' All inner contents will be lost.' : ''}`;

                        Alert.alert(
                            `Delete "${focusedItem.value}"?`,
                            message,
                            [
                                {
                                    text: "Cancel",
                                    style: "cancel",
                                },
                                {
                                    text: hasChildren ? "Force Delete" : "Delete",
                                    style: "destructive",
                                    onPress: () => deleteFolderItemAndChildren(focusedItem, true)
                                },
                            ]
                        );
                    }}
                />
            )],
            [( // Type Toggle
                <ToggleFolderItemTypeButton
                    disabled={!!focusedItem && focusedItem.itemIds.length > 0}
                    currentType={focusedItem?.type ?? EFolderItemType.FOLDER}
                    onClick={toggleFocusedItemType}
                />
            )],
            [( // Transfer
                <TransferFolderIcon onClick={beginFocusedItemTransfer} disabled={!!focusedItem && focusedItem.value.length === 0} />
            )], // Color
            Object.values(selectableColors).map(color => (
                <IconButton
                    name={focusedItem && focusedItem?.platformColor === color ? 'circle.inset.filled' : 'circle'}
                    color={color}
                    size={20}
                    onClick={() => changeFocusedItemColor(color)}
                />
            )),
        ]}
        />
    )
};

export default FolderItemToolbar;