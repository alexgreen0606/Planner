import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import ListItem from '@/components/lists/components/ListItem';
import ThinLine from '@/components/ThinLine';
import useAppTheme from '@/hooks/useAppTheme';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlatformColor, Pressable, RefreshControl, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { MMKV } from 'react-native-mmkv';
import {
    FadeOut,
    runOnJS,
    useAnimatedReaction,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from './ExternalDataProvider';

// ✅ 

type TListPageProps<T extends TListItem, S> = {
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
};

type TContentBounds = {
    upper: number;
    lower: number;
};

const ListPage = <T extends TListItem, S>({
    itemIds,
    listId,
    storageId,
    storage,
    collapsed,
    emptyPageLabelProps,
    toolbar,
    stickyHeader,
    scrollContentAbsoluteTop = 0,
    onIndexChange,
    onCreateItem,
    onDeleteItem,
    ...listItemProps
}: TListPageProps<T, S>) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const headerHeight = useHeaderHeight();
    const pathname = usePathname();

    const { onReloadPage, loading } = useExternalDataContext();

    const placeholderInputRef = useRef<TextInput>(null);

    const [maxHeaderHeight, setMaxHeaderHeight] = useState(headerHeight);
    const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);
    const [draggingItemInitialIndex, setDraggingItemIndex] = useState<number | null>(null);

    const scrollOffset = useSharedValue(0);

    // TODO: calculate this correctly in the future.
    const BOTTOM_NAV_HEIGHT = TOP_SPACER + BOTTOM_SPACER;

    const minContentHeight = useMemo(() => {
        if (stickyHeader) {
            return SCREEN_HEIGHT - scrollContentAbsoluteTop - BOTTOM_NAV_HEIGHT;
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

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);
    const { isLightMode } = useAppTheme();

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

    const handleDragRelease = useCallback((index: number) => {
        if (!draggingItemInitialIndex) return;

        if (index !== draggingItemInitialIndex && onIndexChange) {
            const itemId = itemIds[draggingItemInitialIndex];
            const item = storage.getString(itemId);
            if (item) {
                const parsedItem = JSON.parse(item) as T;
                onIndexChange(index, parsedItem);
            }
        }

        setDraggingItemIndex(null);
    }, [itemIds, onIndexChange, storage]);

    const handleDragBegin = useCallback((index: number) => {
        setDraggingItemIndex(index);
        onCloseTextfield();
    }, [onCloseTextfield]);

    const renderItem = useCallback(({ item: itemId, drag, isActive, getIndex }: RenderItemParams<string>) => (
        <ListItem<T>
            itemIndex={getIndex() ?? 0}
            listId={listId}
            itemId={itemId}
            storage={storage}
            isActive={isActive}
            isDragging={isDraggingItem}
            onLongPress={drag}
            onCreateItem={onCreateItem}
            onDeleteItem={onDeleteItem}
            {...listItemProps}
        />
    ), [listId, storage, draggingItemInitialIndex, onCreateItem, onDeleteItem, listItemProps]);

    const renderFooter = useCallback(() => (
        <>
            {/* Lower List Line */}
            {itemIds.length > 0 && (
                <Pressable onPress={handleEmptySpaceClick}>
                    <ThinLine />
                </Pressable>
            )}

            {/* Empty Click Area */}
            <Pressable
                className='flex-1 min-h-10'
                onPress={handleEmptySpaceClick}
            />
        </>
    ), [itemIds.length, handleEmptySpaceClick]);

    return (
        <>

            {/* List Contents */}
            <DraggableFlatList
                data={itemIds}
                itemExitingAnimation={FadeOut}
                keyExtractor={(itemId) => `${itemId}-row`}
                contentInsetAdjustmentBehavior='automatic'
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollEnabled={!isDraggingItem}
                renderItem={renderItem}
                onRelease={handleDragRelease}
                onDragBegin={handleDragBegin}
                ListHeaderComponent={stickyHeader}
                ListFooterComponent={renderFooter}
                containerStyle={{ flex: 1 }}
                refreshControl={canReloadPath ? (
                    <RefreshControl
                        refreshing={showLoadingSymbol || loading}
                        onRefresh={handleReloadPage}
                    />
                ) : undefined}
                contentContainerStyle={{
                    minHeight: minContentHeight
                }}
                stickyHeaderIndices={stickyHeader ? [0] : undefined}
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator
                dragItemOverflow
            />

            {/* Red Looseleaf Line */}
            {isLightMode && !isPageEmpty && (
                <View
                    className='absolute left-50 top-0 translate-x-12'
                    style={{
                        width: StyleSheet.hairlineWidth,
                        backgroundColor: PlatformColor('systemRed'),
                        height: SCREEN_HEIGHT
                    }}
                />
            )}

            {/* Empty Page Label */}
            {isPageEmpty && <EmptyPageLabel {...emptyPageLabelProps} />}

            {/* List Toolbar */}
            {toolbar}

            {/* Placeholder Field */}
            <TextInput
                ref={placeholderInputRef}
                returnKeyType='done'
                className='absolute w-1 h-1 left-[9999]'
                autoCorrect={false}
            />

        </>
    )
};

export default ListPage;
