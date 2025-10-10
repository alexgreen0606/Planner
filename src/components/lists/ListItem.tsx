import { textfieldIdAtom } from "@/atoms/textfieldId";
import CustomText from "@/components/text/CustomText";
import ThinLine from "@/components/ThinLine";
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from "@/lib/constants/listConstants";
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
    onLongPress: () => void;
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
};

const ListItem = <T extends TListItem>({
    listId,
    itemId,
    storage,
    itemIndex,
    isActive,
    isDragging,
    onLongPress,
    onFocusPlaceholderTextfield,
    onValueChange,
    onCreateItem,
    onDeleteItem,
    onContentClick,
    onSaveToExternalStorage,
    onGetRightIcon,
    onGetRowTextPlatformColor,
    onGetLeftIcon,
    onGetIsItemDeletingCustom
}: TListItemProps<T>) => {
    const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

    const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();

    const [item, setItem] = useMMKVObject<T>(itemId, storage);

    const textPlatformColor = useMemo(() =>
        item ? onGetRowTextPlatformColor?.(item) : 'label',
        [item, onGetRowTextPlatformColor]
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

    const isEditable = textfieldId === item?.id;

    // ================
    //  Event Handlers
    // ================

    const handleSeparatorPress = () => {
        if (!isDragging) {
            onCreateItem(listId, itemIndex);
        }
    };

    const handleContentPress = () => {
        if (!item || isPendingDelete || isDragging) return;

        if (!onContentClick) {

            onFocusPlaceholderTextfield();
            setTextfieldId(itemId);
            return;
        }
        onContentClick(item);
    };

    const handleContentLongPress = () => {
        if (!item || isPendingDelete) return;
        onLongPress();
    };

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
            style={{ height: LIST_ITEM_HEIGHT }}
        >
            {/* Separator Line */}
            <Pressable onPress={handleSeparatorPress}>
                <ThinLine />
            </Pressable>

            <View
                className="flex-row justify-center items-center gap-4 pr-2"
                style={{
                    height: LIST_CONTENT_HEIGHT,
                    marginLeft: LIST_ICON_SPACING
                }}
            >
                {/* Left Icon */}
                {onGetLeftIcon?.(item)}

                {/* Content */}
                <Pressable
                    onPress={handleContentPress}
                    onLongPress={handleContentLongPress}
                    style={{ flex: 1, height: LIST_CONTENT_HEIGHT }}
                >
                    {isEditable ? (
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
                        <CustomText
                            variant='standard'
                            className='flex-1 bg-transparent text-[16px] w-full absolute pr-2'
                            style={[
                                {
                                    height: LIST_ITEM_HEIGHT,
                                    paddingTop: LIST_CONTENT_HEIGHT / 8,
                                    marginRight: LIST_ICON_SPACING / 2,
                                    color: PlatformColor('label'),
                                    fontFamily: 'Text',
                                },
                                valueStyles
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.value}
                        </CustomText>
                    )}
                </Pressable>

                {/* Right Icon */}
                {onGetRightIcon?.(item)}
            </View>
        </MotiView>
    );
};

export default ListItem;