import ListItem from "@/components/lists/ListItem";
import { THIN_LINE_HEIGHT } from "@/lib/constants/miscLayout";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { ReactNode, useRef, useState } from "react";
import { TextInput } from "react-native";
import { MMKV } from "react-native-mmkv";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SortableItem, useSortableList } from "react-native-reanimated-dnd";
import useAppTheme from "./useAppTheme";
import useTextfieldItemAs from "./useTextfieldItemAs";

const useSortableMmkvList = <T extends TListItem, S>(
    itemIds: string[],
    rowHeight: number,
    storage: MMKV,
    listId: string,
    onCreateItem: (listId: string, index: number) => void,
    onDeleteItem: (item: T) => void,
    onIndexChange?: (newIndex: number, prev: T) => void,
    listItemProps?: {
        defaultStorageObject?: S | undefined;
        onValueChange?: ((newValue: string) => void) | undefined;
        onSaveToExternalStorage?: ((item: T) => void) | undefined;
        onContentClick?: ((item: T) => void) | undefined;
        onGetRowTextPlatformColor?: ((item: T) => string) | undefined;
        onGetIsItemDeletingCustom?: ((item: T) => boolean) | undefined;
        onGetLeftIcon?: ((item: T) => React.ReactNode) | undefined;
        onGetRightIcon?: ((item: T) => ReactNode) | undefined;
        onGetIsEditable?: ((item: T) => boolean) | undefined;
    }) => {

    const data = itemIds.map(id => ({ id }));
    const {
        scrollViewRef,
        dropProviderRef,
        handleScroll,
        handleScrollEnd,
        contentHeight,
        getItemProps,
    } = useSortableList({
        data: data,
        itemHeight: rowHeight,
    });

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);
    const { CssColor: { background } } = useAppTheme();

    const placeholderInputRef = useRef<TextInput>(null);

    const [isDragging, setIsDragging] = useState<boolean>(false);

    const isListEmpty = itemIds.length === 0;

    // ================
    //  Event Handlers
    // ================

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    function handleToggleLowerListItem() {
        if (!textfieldItem) {
            // Open a textfield at the bottom of the list.
            onCreateItem(listId, itemIds.length);
            return;
        }

        onCloseTextfield();

        if (textfieldItem.value.trim() === '') {
            onDeleteItem(textfieldItem);
        }
    }

    function handleMoveItem(id: string, from: number, to: number) {
        const itemString = storage.getString(id);
        if (!itemString) return;

        const draggedItem = JSON.parse(itemString) as T;
        if (from !== to && onIndexChange) {
            onIndexChange(to, draggedItem);
        }
    }

    function handleDragStart() {
        setIsDragging(true);
        onCloseTextfield();
    }

    function handleDragEnd() {
        setIsDragging(false);
    }

    const ListItems = () => (
        <Animated.View layout={LinearTransition} style={{ height: contentHeight }} className='w-full'>
            {data.map((item, index) => {
                const itemProps = getItemProps(item, index);
                return (
                    <SortableItem
                        data={data}
                        onMove={handleMoveItem}
                        onDragStart={handleDragStart}
                        onDrop={handleDragEnd}
                        style={{ backgroundColor: background }}
                        key={item.id}
                        {...itemProps}
                    >
                        <ListItem<T>
                            itemIndex={index}
                            listId={listId}
                            itemId={item.id}
                            storage={storage}
                            isActive={false}
                            isDragging={isDragging}
                            height={rowHeight - THIN_LINE_HEIGHT}
                            onFocusPlaceholderTextfield={handleFocusPlaceholder}
                            onCreateItem={onCreateItem}
                            onDeleteItem={onDeleteItem}
                            {...listItemProps}
                        />
                    </SortableItem>
                )
            })}

            {/* Placeholder Field */}
            <TextInput
                ref={placeholderInputRef}
                returnKeyType='done'
                className='absolute w-1 h-1 left-[9999]'
                autoCorrect={false}
            />
        </Animated.View>
    );

    return {
        scrollViewRef,
        dropProviderRef,
        isListEmpty,
        onToggleLowerListItem: handleToggleLowerListItem,
        ListItems
    }
};

export default useSortableMmkvList;