import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyPageLabel from '@/components/EmptyLabel';
import useAppTheme from '@/hooks/useAppTheme';
import { LARGE_MARGIN } from '@/lib/constants/layout';

import GlassIconButton from './buttons/GlassIconButton';
import ColorFadeView from './views/ColorFadeView';

interface IPageContainerProps {
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
}: IPageContainerProps) => {
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
                    iconPlatformColor={addButtonColor}
                    onPress={onAddButtonClick}
                />
            </View>

            {/* Toolbar */}
            {toolbar}
        </>
    );
};

export default PageContainer;
