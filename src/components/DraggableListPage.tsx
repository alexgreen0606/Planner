import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import ThinLine from '@/components/ThinLine';
import useAppTheme from '@/hooks/useAppTheme';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { LARGE_MARGIN, THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { ReactElement, ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, TextInput, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Animated, {
    LinearTransition,
    runOnJS,
    useAnimatedReaction,
    useSharedValue
} from 'react-native-reanimated';
import { DropProvider, SortableItem, useSortableList } from 'react-native-reanimated-dnd';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './icons/customButtons/GlassIconButton';
import ListItem from './lists/ListItem';
import PlannerHeader from './PlannerHeader/PlannerHeader';
import ColorFadeView from './views/ColorFadeView';
import FillerView from './views/FillerView';

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
    rowHeight?: number;
    addButtonColor?: string;
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
    rowHeight = 40,
    addButtonColor = 'systemBlue',
    onIndexChange,
    onCreateItem,
    onDeleteItem,
    ...listItemProps
}: TDraggableListPageProps<T, S>) => {
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const pathname = usePathname();

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

    const { onReloadPage, loadingPathnames } = useExternalDataContext();

    const { CssColor: { background }, ColorArray: { Screen: { upper } } } = useAppTheme();
    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<T>(storage);

    const placeholderInputRef = useRef<TextInput>(null);

    const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const scrollOffset = useSharedValue(0);

    // TODO: calculate this correctly in the future.
    const BOTTOM_NAV_HEIGHT = 86;

    const canReloadPath = reloadablePaths.some(p => pathname.includes(p));
    const isPageEmpty = itemIds.length === 0;

    // TODO: not setting scroll offset right now. Watch scrollOffset and turn off loading symbol when it returns to 0.
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

    return (
        <DropProvider ref={dropProviderRef}>

            <Animated.ScrollView
                ref={scrollViewRef}

                // TODO: create custom refresh logic
                refreshControl={canReloadPath ? (
                    <RefreshControl
                        refreshing={showLoadingSymbol && loadingPathnames.has(listId)}
                        onRefresh={handleReloadPage}
                    />
                ) : undefined}

                contentInsetAdjustmentBehavior='always'
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={SCROLL_THROTTLE}
                contentContainerStyle={{ minHeight: SCREEN_HEIGHT }}
                style={{ height: SCREEN_HEIGHT, backgroundColor: background }}
            >

                {/* Header Filler */}
                <FillerView>
                    {stickyHeader}
                </FillerView>

                {/* List Items */}
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
                </Animated.View>

                {/* Bottom of List Separator */}
                {itemIds.length > 0 && (
                    <Pressable onPress={handleEmptySpaceClick}>
                        <ThinLine />
                    </Pressable>
                )}

                <View className='flex-1' />

                {/* Add Button Filler */}
                <FillerView style={{ paddingBottom: LARGE_MARGIN * 2 }}>
                    <GlassIconButton
                        systemImage='plus'
                        isPrimary
                        color={addButtonColor}
                        onPress={handleEmptySpaceClick}
                    />
                </FillerView>

            </Animated.ScrollView>

            {/* Sticky Header */}
            {stickyHeader && (
                <>
                    <View className='absolute w-full left-0 top-0'>
                        <ColorFadeView colors={upper} solidHeight={TOP_SPACER} totalHeight={TOP_SPACER + 16} />
                    </View>
                    <View className='absolute left-0' style={{ top: TOP_SPACER }}>
                        {stickyHeader}
                    </View>
                </>
            )}

            {/* Empty Label */}
            {isPageEmpty && (
                <EmptyPageLabel {...emptyPageLabelProps} />
            )}

            {/* Add Button */}
            <View
                style={{ bottom: BOTTOM_NAV_HEIGHT + LARGE_MARGIN }}
                className='absolute right-4'
            >
                <GlassIconButton
                    systemImage='plus'
                    isPrimary
                    color={addButtonColor}
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
        </DropProvider>
    )
};

export default DraggableListPage;
