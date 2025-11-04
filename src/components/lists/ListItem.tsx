import { textfieldIdAtom } from "@/atoms/textfieldId";
import CustomText from "@/components/text/CustomText";
import ThinLine from "@/components/ThinLine";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import { useAtom } from "jotai";
import { MotiView } from "moti";
import React, { ReactNode, useMemo } from "react";
import { PlatformColor, Pressable, TextStyle, View } from "react-native";
import { MMKV, useMMKVObject } from "react-native-mmkv";
import ListItemTextfield from "./ListItemTextfield";

// ✅ 

type TListItemProps<T extends TListItem> = {
    listId: string;
    itemId: string;
    itemIndex: number;
    isActive: boolean;
    isDragging: boolean;
    storage: MMKV;
    height: number;
    onFocusPlaceholderTextfield: () => void;
    onCreateItem: (listId: string, index: number) => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newValue: string) => void;
    onSaveToExternalStorage?: (item: T) => void;
    onContentClick?: (item: T) => void;
    onGetRowTextPlatformColor?: (item: T) => string;
    onGetLeftIcon?: (item: T) => ReactNode;
    onGetRightIcon?: (item: T) => ReactNode;
    onGetIsItemDeletingCustom?: (item: T) => boolean;
    onGetIsEditable?: (item: T) => boolean;
};

const ListItem = <T extends TListItem>({
    listId,
    itemId,
    storage,
    itemIndex,
    isActive,
    isDragging,
    height,
    onFocusPlaceholderTextfield,
    onValueChange,
    onCreateItem,
    onDeleteItem,
    onContentClick,
    onSaveToExternalStorage,
    onGetRightIcon,
    onGetRowTextPlatformColor,
    onGetLeftIcon,
    onGetIsEditable,
    onGetIsItemDeletingCustom
}: TListItemProps<T>) => {
    const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

    const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();

    const [item, setItem] = useMMKVObject<T>(itemId, storage);

    const textPlatformColor = useMemo(() =>
        item ? onGetRowTextPlatformColor?.(item) : 'label',
        [item, onGetRowTextPlatformColor]
    );

    const isItemEditable = useMemo(() =>
        item ? (onGetIsEditable?.(item) ?? true) : true,
        [item]
    );

    const isPendingDelete = item ?
        (onGetIsItemDeletingCustom?.(item) ?? onGetIsItemDeletingCallback(item)) :
        false;

    const valueStyles: TextStyle = {
        color: PlatformColor(
            textPlatformColor ??
            (isPendingDelete ? 'tertiaryLabel' : 'label')
        ),
        textDecorationLine: isPendingDelete ? 'line-through' : undefined
    };

    const isEditing = textfieldId === item?.id;

    // ================
    //  Event Handlers
    // ================

    function handleSeparatorPress() {
        if (!isDragging) {
            onCreateItem(listId, itemIndex);
        }
    }

    function handleContentPress() {
        if (!item || isPendingDelete || isDragging || !isItemEditable) return;

        if (!onContentClick) {

            onFocusPlaceholderTextfield();
            setTextfieldId(itemId);
            return;
        }
        onContentClick(item);
    }

    // ================
    //  User Interface
    // ================

    if (!item) return null;

    return (
        <MotiView
            animate={{
                opacity: isActive ? 0.8 : 1,
                translateY: isActive ? -6 : 0,
            }}
            className='w-full'
        >
            {/* Separator Line */}
            <Pressable onPress={handleSeparatorPress}>
                <ThinLine />
            </Pressable>

            <View className="flex-row items-center gap-4 px-4" style={{ height }}>

                {/* Left Icon */}
                {onGetLeftIcon?.(item)}

                {/* Content */}
                {isEditing ? (
                    <ListItemTextfield<T>
                        item={item}
                        customStyle={valueStyles}
                        onFocusPlaceholderTextfield={onFocusPlaceholderTextfield}
                        onDeleteItem={onDeleteItem}
                        onSetItemInStorage={setItem}
                        onValueChange={onValueChange}
                        onSaveToExternalStorage={onSaveToExternalStorage}
                        onCreateChildTextfield={() => onCreateItem(listId, itemIndex + 1)}
                    />
                ) : (
                    <Pressable
                        onPress={handleContentPress}
                        className="flex-1"
                    >
                        <CustomText
                            variant='listRow'
                            customStyle={valueStyles}
                            numberOfLines={1}
                            ellipsizeMode="tail"

                        >
                            {item.value}
                        </CustomText>
                    </Pressable>
                )}

                {/* Right Icon */}
                {onGetRightIcon?.(item)}

            </View>
        </MotiView>
    )
};

export default ListItem;