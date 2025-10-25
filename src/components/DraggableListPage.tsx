import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import ThinLine from '@/components/ThinLine';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, TextInput, useWindowDimensions, View } from 'react-native';
import DraggableFlatList, { DragEndParams, RenderItemParams } from 'react-native-draggable-flatlist';
import { MMKV } from 'react-native-mmkv';
import {
    FadeOut,
    runOnJS,
    useAnimatedReaction,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './icons/customButtons/GlassIconButton';
import ListItem from './lists/ListItem';

// ✅ 

type TDraggableListPageProps<T extends TListItem, S> = {
    emptyPageLabelProps: TEmptyPageLabelProps;
    toolbar?: ReactNode;
    stickyHeader?: ReactElement;
    scrollContentAbsoluteTop?: number;
    itemIds: string[];
    listId: string;
    storageId: EStorageId;
    storage: MMKV;
    defaultStorageObject?: S;
    collapsed?: boolean;
    minRowHeight?: number;
    onCreateItem: (listId: string, index: number) => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newValue: string) => void;
    onIndexChange?: (newIndex: number, prev: T) => void;
    onSaveToExternalStorage?: (item: T) => void;
    onContentClick?: (item: T) => void;
    onGetRowTextPlatformColor?: (item: T) => string;
    onGetIsItemDeletingCustom?: (item: T) => boolean;
    onGetLeftIcon?: (item: T) => ReactNode;
    onGetRightIcon?: (item: T) => ReactNode;
    onGetIsEditable?: (item: T) => boolean;
};

type TContentBounds = {
    upper: number;
    lower: number;
};

const BUTTON_SIZE = 45;
const BUTTON_MARGIN = 12;

const DraggableListPage = <T extends TListItem, S>({
    itemIds,
    listId,
    storageId,
    storage,
    collapsed,
    emptyPageLabelProps,
    toolbar,
    stickyHeader,
    scrollContentAbsoluteTop = 0,
    minRowHeight,
    onIndexChange,
    onCreateItem,
    onDeleteItem,
    ...listItemProps
}: TDraggableListPageProps<T, S>) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const headerHeight = useHeaderHeight();
    const pathname = usePathname();

    const { onReloadPage, loadingPathname } = useExternalDataContext();

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);

    const placeholderInputRef = useRef<TextInput>(null);

    const [maxHeaderHeight, setMaxHeaderHeight] = useState(headerHeight);
    const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);
    const [draggingItemInitialIndex, setDraggingItemIndex] = useState<number | null>(null);

    const scrollOffset = useSharedValue(0);

    // TODO: calculate this correctly in the future.
    const BOTTOM_NAV_HEIGHT = TOP_SPACER * 1.2;
    const minContentHeight = useMemo(() => {
        if (stickyHeader) {
            return SCREEN_HEIGHT - scrollContentAbsoluteTop - BOTTOM_NAV_HEIGHT - BUTTON_SIZE - BUTTON_MARGIN * 2;
        }
        return SCREEN_HEIGHT - maxHeaderHeight - BOTTOM_NAV_HEIGHT;
    }, [stickyHeader, scrollContentAbsoluteTop, maxHeaderHeight]);

    const contentBounds: TContentBounds = useMemo(() => {
        const upper = stickyHeader
            ? scrollContentAbsoluteTop
            : headerHeight;

        const lower = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAV_HEIGHT;

        return { upper, lower };
    }, [stickyHeader, scrollContentAbsoluteTop, headerHeight]);

    const canReloadPath = reloadablePaths.some(p => pathname.includes(p));
    const isDraggingItem = Boolean(draggingItemInitialIndex);
    const isPageEmpty = itemIds.length === 0;

    // Track the maximum height of the page's header.
    useEffect(() => {
        setMaxHeaderHeight(prev => Math.max(prev, headerHeight));
    }, [headerHeight]);

    // Watch scrollOffset and turn off loading symbol when it returns to 0.
    useAnimatedReaction(
        () => scrollOffset.value,
        (currentOffset) => {
            if (currentOffset <= 0 && showLoadingSymbol) {
                runOnJS(setShowLoadingSymbol)(false);
            }
        }
    );

    // ================
    //  Event Handlers
    // ================

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    function handleReloadPage() {
        setShowLoadingSymbol(true);
        onReloadPage();
    }

    function handleEmptySpaceClick() {
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

    const endDragCallback = useCallback(({ from, to }: DragEndParams<string>) => {
        setDraggingItemIndex(null);

        const draggedItemId = itemIds[from];
        if (!draggedItemId) return;

        const itemString = storage.getString(draggedItemId);
        if (!itemString) return;

        const draggedItem = JSON.parse(itemString) as T;
        if (from !== to && onIndexChange) {
            onIndexChange(to, draggedItem);
        }

    }, [listId, draggingItemInitialIndex, onIndexChange, setDraggingItemIndex]);

    const beginDragCallback = useCallback((index: number) => {
        setDraggingItemIndex(index);
        onCloseTextfield();
    }, [onCloseTextfield]);

    const renderItemCallback = useCallback(({ item: itemId, drag, isActive, getIndex }: RenderItemParams<string>) => (
        <ListItem<T>
            itemIndex={getIndex() ?? 0}
            listId={listId}
            itemId={itemId}
            storage={storage}
            isActive={isActive}
            isDragging={isDraggingItem}
            minHeight={minRowHeight}
            onFocusPlaceholderTextfield={handleFocusPlaceholder}
            onLongPress={onIndexChange ? drag : undefined}
            onCreateItem={onCreateItem}
            onDeleteItem={onDeleteItem}
            {...listItemProps}
        />
    ), [listId, storage, draggingItemInitialIndex, onCreateItem, onDeleteItem, listItemProps]);

    const renderFooterCallback = useCallback(() => itemIds.length > 0 && (
        <Pressable onPress={handleEmptySpaceClick}>
            <ThinLine />
        </Pressable>
    ), [itemIds.length, handleEmptySpaceClick]);

    return (
        <View className='flex-1'>

            {/* List Contents */}
            <DraggableFlatList
                data={itemIds}
                itemExitingAnimation={FadeOut}
                keyExtractor={(itemId) => `${itemId}-row`}
                contentInsetAdjustmentBehavior='automatic'
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollEnabled={!isDraggingItem}
                renderItem={renderItemCallback}
                onDragBegin={beginDragCallback}
                onDragEnd={endDragCallback}
                ListFooterComponent={renderFooterCallback}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={stickyHeader}
                automaticallyAdjustKeyboardInsets
                refreshControl={canReloadPath ? (
                    <RefreshControl
                        refreshing={showLoadingSymbol || loadingPathname?.includes(listId)}
                        onRefresh={handleReloadPage}
                    />
                ) : undefined}
                stickyHeaderIndices={stickyHeader ? [0] : undefined}
                contentContainerStyle={{
                    minHeight: minContentHeight,
                    paddingBottom: BUTTON_SIZE + BUTTON_MARGIN
                }}
                className='flex-grow'
            />

            {/* Empty Label */}
            {isPageEmpty && (
                <EmptyPageLabel {...emptyPageLabelProps} />
            )}

            {/* Add Button */}
            <View
                style={{ bottom: BOTTOM_NAV_HEIGHT + BUTTON_MARGIN }}
                className='absolute left-8'
            >
                <GlassIconButton
                    systemImage='plus'
                    isPrimary
                    onPress={handleEmptySpaceClick}
                />
            </View>

            {/* Toolbar */}
            {toolbar}

            {/* Placeholder Field */}
            <TextInput
                ref={placeholderInputRef}
                returnKeyType='done'
                className='absolute w-1 h-1 left-[9999]'
                autoCorrect={false}
            />
        </View>
    )
};

export default DraggableListPage;
