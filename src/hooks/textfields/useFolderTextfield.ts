import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { useState } from "react";
import { useMMKV } from "react-native-mmkv";
import { useTextfieldItemAs } from "./useTextfieldItemAs";

// ✅ 

const useFolderTextfield = () => {
    const storage = useMMKV({ id: EStorageId.FOLDER_ITEM });

    const { textfieldItem, onSetTextfieldItem, onCloseTextfield } = useTextfieldItemAs<IFolderItem>(storage);

    const [isTransfering, setIsTransfering] = useState(false);

    function handleBeginTransfer() {
        setIsTransfering(true);
    }

    function handleEndTransfer() {
        setIsTransfering(false);
    }

    function handleChangeColor(platformColor: string) {
        onSetTextfieldItem((prev) => {
            if (!prev) return prev;
            return { ...prev, platformColor };
        });
    }

    function handleToggleType() {
        onSetTextfieldItem((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                type:
                    prev.type === EFolderItemType.FOLDER ? EFolderItemType.LIST : EFolderItemType.FOLDER
            };
        });
    }

    return {
        textfieldItem,
        isTransferMode: isTransfering,
        onEndTransfer: handleEndTransfer,
        onBeginTransfer: handleBeginTransfer,
        onChangeColor: handleChangeColor,
        onToggleType: handleToggleType,
        onCloseTextfield
    }

}

export default useFolderTextfield;