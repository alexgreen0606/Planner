import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import ThinLine from '@/components/ThinLine';
import useAppTheme from '@/hooks/useAppTheme';
import useSortableMmkvList from '@/hooks/useSortableMmkvList';
import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { LARGE_MARGIN } from '@/lib/constants/miscLayout';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useScrollRegistry } from '@/providers/ScrollRegistry';

import { useExternalDataContext } from '../providers/ExternalDataProvider';
import GlassIconButton from './icons/customButtons/GlassIconButton';
import ColorFadeView from './views/ColorFadeView';
import FillerView from './views/FillerView';

// ✅


type TPageContainerProps = {
    emptyPageLabel: string;
    children: ReactNode;
    onAddButtonClick: () => void;

    isPageEmpty?: boolean;
    toolbar?: ReactNode;
    stickyHeader?: ReactNode;
    addButtonColor?: string;
};

// TODO: calculate this correctly in the future.
const BOTTOM_NAV_HEIGHT = 86;

const PageContainer = ({
    emptyPageLabel,
    toolbar,
    isPageEmpty,
    stickyHeader,
    addButtonColor = 'systemBlue',
    onAddButtonClick,
    children
}: TPageContainerProps) => {
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const {
        ColorArray: {
            Screen: { upper }
        }
    } = useAppTheme();

    return (
        <>

            {children}

            {/* Sticky Header */}
            {stickyHeader && (
                <>
                    <View className="absolute w-full left-0 top-0">
                        <ColorFadeView colors={upper} solidHeight={TOP_SPACER} totalHeight={TOP_SPACER + 16} />
                    </View>
                    <View className="absolute left-0" style={{ top: TOP_SPACER }}>
                        {stickyHeader}
                    </View>
                </>
            )}

            {/* Empty Label */}
            {isPageEmpty && <EmptyPageLabel label={emptyPageLabel} />}

            {/* Add Button */}
            <View style={{ bottom: BOTTOM_NAV_HEIGHT + LARGE_MARGIN }} className="absolute right-4">
                <GlassIconButton
                    systemImage="plus"
                    isPrimary
                    color={addButtonColor}
                    onPress={onAddButtonClick}
                />
            </View>

            {/* Toolbar */}
            {toolbar}
        </>
    );
};

export default PageContainer;
