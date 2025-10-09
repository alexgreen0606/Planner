import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import useAppTheme from '@/hooks/useAppTheme';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PlatformColor, RefreshControl, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import {
    runOnJS,
    useAnimatedReaction,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from './ExternalDataProvider';
import { ScrollProvider } from './ScrollProvider';

// ✅ 

type TPageProviderProps = {
    children: ReactNode;
    emptyPageLabelProps: TEmptyPageLabelProps;
    toolbar?: ReactNode;
    hasStickyHeader?: boolean;
    scrollContentAbsoluteTop?: number;
};

type TContentBounds = {
    upper: number;
    lower: number;
};

type TPageProviderContextValue = {
    contentBounds: TContentBounds;
    onSetIsPageEmpty: (val: boolean) => void;
    // Focuses Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
}

const ScrollPageContext = createContext<TPageProviderContextValue | null>(null);

export const PageProvider = ({
    children,
    emptyPageLabelProps,
    toolbar,
    hasStickyHeader,
    scrollContentAbsoluteTop = 0,
}: TPageProviderProps) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const headerHeight = useHeaderHeight();
    const pathname = usePathname();

    const { onReloadPage, loading } = useExternalDataContext();

    const placeholderInputRef = useRef<TextInput>(null);

    const [maxHeaderHeight, setMaxHeaderHeight] = useState(headerHeight);
    const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);
    const [isPageEmpty, setIsPageEmpty] = useState(false);

    const scrollOffset = useSharedValue(0);

    // TODO: calculate this correctly in the future.
    const BOTTOM_NAV_HEIGHT = TOP_SPACER + BOTTOM_SPACER;

    const minContentHeight = useMemo(() => {

        if (hasStickyHeader) {
            return SCREEN_HEIGHT - scrollContentAbsoluteTop - BOTTOM_NAV_HEIGHT;
        }
        return SCREEN_HEIGHT - maxHeaderHeight - BOTTOM_NAV_HEIGHT;
    }, [hasStickyHeader, scrollContentAbsoluteTop, maxHeaderHeight]);

    const contentBounds: TContentBounds = useMemo(() => {
        const upper = hasStickyHeader
            ? scrollContentAbsoluteTop
            : headerHeight;

        const lower = SCREEN_HEIGHT - BOTTOM_SPACER - BOTTOM_NAV_HEIGHT;

        return { upper, lower };
    }, [hasStickyHeader, scrollContentAbsoluteTop, headerHeight]);

    const canReloadPath = reloadablePaths.some(p => pathname.includes(p));

    const { isLightMode } = useAppTheme();

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

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    function handleReloadPage() {
        setShowLoadingSymbol(true);
        onReloadPage();
    }

    return (
        <ScrollPageContext.Provider value={{
            contentBounds,
            onFocusPlaceholder: handleFocusPlaceholder,
            onSetIsPageEmpty: setIsPageEmpty
        }}>

            {/* Page Contents */}
            {/* <ScrollProvider
                scrollOffset={scrollOffset}
                contentContainerStyle={{
                    minHeight: minContentHeight
                }}
                refreshControl={canReloadPath ? (
                    <RefreshControl onRefresh={handleReloadPage} refreshing={showLoadingSymbol || loading} />
                ) : undefined}
                contentInsetAdjustmentBehavior="automatic"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator
                stickyHeaderIndices={hasStickyHeader ? [0] : undefined}
            > */}
                {children}


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
            {/* </ScrollProvider> */}

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

        </ScrollPageContext.Provider>
    )
};


export const usePageContext = () => {
    const context = useContext(ScrollPageContext);
    if (!context) {
        throw new Error("usePageContext must be used within a PageProvider");
    }
    return context;
};