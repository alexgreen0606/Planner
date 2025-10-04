import EmptyPageLabel, { TEmptyPageLabelProps } from '@/components/EmptyLabel';
import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { usePathname } from 'expo-router';
import React, { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { KeyboardAvoidingView, RefreshControl, TextInput } from 'react-native';
import {
    useSharedValue
} from 'react-native-reanimated';
import { useExternalDataContext } from './ExternalDataProvider';
import { ScrollProvider } from './ScrollProvider';

// ✅ 

type TPageProviderProps = {
    children: ReactNode;
    hasStickyHeader?: boolean;
    emptyPageLabelProps: TEmptyPageLabelProps;
};

type TPageProviderContextValue = {
    onSetIsPageEmpty: (val: boolean) => void;
    // Focuses Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
}

const ScrollPageContext = createContext<TPageProviderContextValue | null>(null);

export const PageProvider = ({
    children,
    hasStickyHeader,
    emptyPageLabelProps
}: TPageProviderProps) => {
    const pathname = usePathname();

    const { onReloadPage, loading } = useExternalDataContext();

    const placeholderInputRef = useRef<TextInput>(null);

    const [isPageEmpty, setIsPageEmpty] = useState(false);

    const scrollOffset = useSharedValue(0);

    const canReloadPath = reloadablePaths.some(p => pathname.includes(p));

    const manualPadHeaderScrollProps = hasStickyHeader ? {
        stickyHeaderIndices: [0]
    } : {};

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    return (
        <ScrollPageContext.Provider value={{
            onFocusPlaceholder: handleFocusPlaceholder, onSetIsPageEmpty: setIsPageEmpty
        }}>
            <ScrollProvider
                scrollOffset={scrollOffset}
                contentContainerStyle={{
                    flexGrow: 1
                }}
                refreshControl={canReloadPath ? (
                    <RefreshControl onRefresh={onReloadPage} refreshing={loading} />
                ) : undefined}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={!isPageEmpty}
                {...manualPadHeaderScrollProps}
                automaticallyAdjustKeyboardInsets
            >
                {children}
            </ScrollProvider>

            {/* Empty Page Label */}
            {isPageEmpty && (
                <EmptyPageLabel {...emptyPageLabelProps} />
            )}

            {/* List Toolbars */}
            <PlannerEventToolbar />
            <FolderItemToolbar />
            <CountdownEventToolbar />
            <RecurringEventToolbar />

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